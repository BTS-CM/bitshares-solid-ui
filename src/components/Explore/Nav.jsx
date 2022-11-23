import { For } from "solid-js";
import { useLocation } from "solid-start";

export default function Nav() {
    const location = useLocation();

    return (
        <div class="inline-flex align-items-center">
            <m-tabs>
                <For each={["accounts", "assets", "blocks", "committee", "fees", "markets", "pools", "witnesses"]}>
                    {
                        (address) => {
                            if (location.pathname.includes("accounts")) {
                                return (
                                    <a href={`/explorer/${address}`}>
                                        <m-tab selected>{address}</m-tab>
                                    </a>
                                );
                            } else {
                                return (
                                    <a href={`/explorer/${address}`}>
                                        <m-tab>{address}</m-tab>
                                    </a>
                                );
                            }
                        }
                    }
                </For>
            </m-tabs>
        </div>
    );
}
