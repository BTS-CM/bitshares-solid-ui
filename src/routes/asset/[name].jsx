import { useParams } from "solid-start";

import "../index.css";
export default function Asset() {
    const params = useParams();

    return (
        <main>
            <m-row>
                <m-col span="12">
                    <m-box>Asset page</m-box>
                    <div>asset {params.name}</div>
                </m-col>
            </m-row>
        </main>
    );
}