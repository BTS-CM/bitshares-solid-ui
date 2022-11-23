import { useParams } from "solid-start";

import "../index.css";
export default function Account() {
    const params = useParams();

    return (
        <main>
            <m-row>
                <m-col span="12">
                    <m-box>Account portfolio</m-box>
                    <div>User {params.name}</div>
                </m-col>
            </m-row>
        </main>
    );
}