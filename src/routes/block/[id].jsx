import { useParams } from "solid-start";

import "../index.css";
export default function Block() {
  const params = useParams();

  return (
    <main>
      <m-row>
          <m-col span="12">
              <m-box>Block page</m-box>
              <div>asset {params.id}</div>
          </m-col>
      </m-row>
    </main>
  );
}