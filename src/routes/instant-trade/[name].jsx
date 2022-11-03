import { useParams } from "solid-start";

import "../index.css";
export default function InstantTrade() {
  const params = useParams();

  return (
    <main>
      <m-row>
          <m-col span="12">
              <m-box>Instant trade</m-box>
              <div>trading pair: {params.name}</div>
          </m-col>
      </m-row>
    </main>
  );
}