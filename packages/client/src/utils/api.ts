export const fetchPersonaKycStatus = async (account: string) => {
  const resp = await fetch(`/api/kyc/${account}`);
  const body = await resp.json();
  return body.kycApproved;
};
