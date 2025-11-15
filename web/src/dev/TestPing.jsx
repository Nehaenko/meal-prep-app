import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const ME = gql`
  query Me {
    me {
      id
      email
    }
  }
`;

export default function TestPing() {
  const { data, loading, error } = useQuery(ME);

  if (loading) return <div>loading…</div>;
  if (error) return <pre>error: {error.message}</pre>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}