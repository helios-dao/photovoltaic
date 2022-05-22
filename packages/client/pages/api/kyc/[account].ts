import type { NextApiRequest, NextApiResponse } from "next";
import { config } from "src/config";

const API_URL = "https://withpersona.com/api/v1/inquiries?";

const hasCompletedKyc = async (referenceId: string) => {
  const url =
    API_URL +
    new URLSearchParams({
      "filter[reference-id]": referenceId,
    });

  try {
    const resp = await fetch(url, {
      headers: {
        Authorization: `Bearer ${config.personaApiKey}`,
        "Persona-Version": "2021-05-14",
      },
    });
    const json = await resp.json();

    if (typeof json.data === "undefined") return false;
    const inquiry = json.data.find(
      (inquiry) => inquiry.attributes.status === "completed",
    );
    return !!inquiry;
  } catch (error) {
    console.error("Error while fetching from Persona API:", error);
    return false;
  }
};

type ResponseData = {
  kycComplete: boolean;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>,
) {
  if (req.method !== "GET") return res.status(404);

  const { account } = req.query;
  const kycComplete = await hasCompletedKyc(account);
  res.status(200).json({ kycComplete });
}
