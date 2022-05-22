import React from 'react'

const FallbackUI = ({ error }) => {
  return <h3>`Something went wrong ${error.}`</h3>;
};

export default FallbackUI;