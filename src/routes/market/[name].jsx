import { useParams } from "solid-start";

import "../index.css";
export default function Market() {
    const params = useParams();

    return (
        <main>
            <m-row>
                <m-col span="12">
                    <m-box>Market (exchange)</m-box>
                    <div>Market: {params.name}</div>
                </m-col>
            </m-row>
        </main>
    );
}