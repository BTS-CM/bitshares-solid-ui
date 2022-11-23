import Nav from "~/components/Explore/Nav";
import "../index.css";

export default function ExploreAssets() {
    return (
        <main>
            <m-row>
                <m-col span="12">
                    <Nav />
                </m-col>
                <m-col span="12">
                    <m-box>Explore assets</m-box>
                </m-col>
            </m-row>
        </main>
    );
}