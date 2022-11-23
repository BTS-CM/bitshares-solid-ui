import Nav from "~/components/Explore/Nav";
import "../index.css";

export default function ExploreFees() {
    return (
        <main>
            <m-row>
                <m-col span="12">
                    <Nav />
                </m-col>
                <m-col span="12">
                    <m-box>Explore fees</m-box>
                </m-col>
            </m-row>
        </main>
    );
}