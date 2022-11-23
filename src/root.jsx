// @refresh reload
import { Routes } from "@solidjs/router";
import { Suspense } from "solid-js";
import { ErrorBoundary } from "solid-start/error-boundary";
import { FileRoutes, Head, Meta, Scripts, Title, useLocation } from "solid-start";

export default function Root() {
    const location = useLocation();

    return (
        <html lang="en">
            <Head>
                <Title>Bitshares</Title>
                <Meta charset="utf-8" />
                <link rel="stylesheet" href="https://unpkg.com/m-@1.4.0/dist/min.css" />
                <script defer src="https://unpkg.com/m-@1.4.0/dist/min.js" />
                <Meta name="viewport" content="width=device-width, initial-scale=1" />
            </Head>
            <body>
                <header>
                    <div class="inline-flex align-items-center">
                        <a href="/" class="mar-l-sm mar-r-sm">
                            <img src="/bts.png" alt="logo" height="40px" width="30px" />
                        </a>
                        <m-tabs>
                            <a href="/account/nft.artist" class="mar-l-sm mar-r-sm">
                                {
                                    location.pathname.includes("account")
                                        ? <m-tab selected><m-icon name="wallet" /> Portfolio</m-tab>
                                        : <m-tab><m-icon name="wallet" /> Portfolio</m-tab>
                                }
                            </a>
                            <a href="/market/BTS_USD" class="mar-l-sm mar-r-sm">
                                {
                                    location.pathname.includes("market")
                                        ? <m-tab selected><m-icon name="chart" /> Exchange</m-tab>
                                        : <m-tab><m-icon name="chart" /> Exchange</m-tab>
                                }
                            </a>
                            <a href="/credit-offer" class="mar-l-sm mar-r-sm">
                                {
                                    location.pathname.includes("credit-offer")
                                        ? <m-tab selected><m-icon name="support" /> Credit Offer</m-tab>
                                        : <m-tab><m-icon name="support" /> Credit Offer</m-tab>
                                }
                            </a>
                            <a href="/explorer/blocks" class="mar-l-sm mar-r-sm">
                                {
                                    location.pathname.includes("explore")
                                        ? <m-tab selected><m-icon name="magnifier" /> Explore</m-tab>
                                        : <m-tab><m-icon name="magnifier" /> Explore</m-tab>
                                }
                            </a>
                            <a href={location.pathname}>
                                {
                                    !["account", "market", "credit-offer", "explorer"].includes(location.pathname.split("/")[1]) && location.pathname !== "/"
                                        ? <m-tab selected>{location.pathname.split("/")[1].split("-").join(" ")}</m-tab>
                                        : null
                                }
                            </a>
                        </m-tabs>
                        <m-menu>
                            <m-icon slot="trigger" name="menu" class="push" />
                            <div slot="items" class="menuDropDown">
                                <a href><m-icon name="login" /> Login</a>
                                <a href="/account/nft.artist"><m-icon name="wallet" /> Portfolio</a>
                                <a href="/market/BTS_USD"><m-icon name="chart" /> Exchange</a>
                                <a href="/credit-offer"><m-icon name="support" /> Credit Offer</a>
                                <a href="/liquidity-pools"><m-icon name="diamond" /> Liquidity Pools</a>
                                <a href="/explorer/blocks"><m-icon name="magnifier" /> Explore</a>
                                <a href="/send"><m-icon name="paper-plane" /> Send</a>
                                <a href="/deposit"><m-icon name="plus" /> Deposit</a>
                                <a href="/withdraw"><m-icon name="minus" /> Withdraw</a>
                                <a href="/voting"><m-icon name="like" /> Voting</a>
                                <a href="/spotlight"><m-icon name="diamond" /> Spotlight</a>
                                <a href="/settings/general"><m-icon name="settings" /> Settings</a>
                                <a href="/accounts"><m-icon name="folder" /> Accounts</a>
                                <m-menu>
                                    <a><m-icon slot="trigger" name="wrench"> Advanced</m-icon></a>
                                    <div slot="items" class="menuDropDown">
                                        <a href="/voting"><m-icon name="like" /> Voting</a>
                                        <a href="/assets"><m-icon name="list" /> Assets</a>
                                        <a href="/liquidity-pools"><m-icon name="pie-chart" /> Pools</a>
                                        <a href="/signed-messages"><m-icon name="book-open" /> Signed messages</a>
                                        <a href="/membership-stats"><m-icon name="briefcase" /> Membership stats</a>
                                        <a href="/vesting-balances"><m-icon name="clock" /> Vesting balances</a>
                                        <a href="/whitelist"><m-icon name="list" /> Whitelist</a>
                                        <a href="/permissions"><m-icon name="key" /> Permissions</a>
                                    </div>
                                </m-menu>
                            </div>
                        </m-menu>
                    </div>
                </header>
                <ErrorBoundary>
                    <Suspense>
                        <Routes>
                            <FileRoutes />
                        </Routes>
                    </Suspense>
                </ErrorBoundary>
                <Scripts />
            </body>
        </html>
    );
}
