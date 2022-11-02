// @refresh reload
import { Routes } from "@solidjs/router";
import { Suspense } from "solid-js";
import { ErrorBoundary } from "solid-start/error-boundary";
import { FileRoutes, Head, Meta, Scripts, Title } from "solid-start";
export default function Root() {
  return (
    <html lang="en">
      <Head>
        <Title>Bitshares</Title>
        <Meta charset="utf-8" />
        <link rel="stylesheet" href="https://unpkg.com/m-@1.4.0/dist/min.css" />
        <script defer src="https://unpkg.com/m-@1.4.0/dist/min.js"></script>
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body>
        <header class="bg-offwhite">
          <m-container class="flex">       
            <nav class="mar-l-lg">
              <a href="#" class="mar-l-sm mar-r-sm">
                <img src="/bts.png" alt="logo" height="40px" width="30px" />
              </a>
              <a href="/account" class="mar-l-sm mar-r-sm vertAlign">Portfolio</a>
              <a href="/exchange" class="mar-l-sm mar-r-sm vertAlign">Exchange</a>
              <a href="/credit-offer" class="mar-l-sm mar-r-sm vertAlign">Credit Offer</a>
              <a href="/explore" class="mar-l-sm mar-r-sm vertAlign">Explore</a>
            </nav>
            <m-menu class="push">
                <button slot="trigger" ord="secondary">
                  <m-icon name="menu"></m-icon>
                </button>
                <div slot="items" class="menuDropDown">
                  <a href><m-icon name="login"></m-icon> Login</a>
                  <a href="/accounts"><m-icon name="wallet"></m-icon> Portfolio</a>
                  <a href="/exchange"><m-icon name="chart"></m-icon> Exchange</a>
                  <a href="/credit-offer"><m-icon name="support"></m-icon> Credit Offer</a>
                  <a href="/liquidity-pools"><m-icon name="diamond"></m-icon> Liquidity Pools</a>
                  <a href="/explore"><m-icon name="magnifier"></m-icon> Explore</a>
                  <a href="/send"><m-icon name="paper-plane"></m-icon> Send</a>
                  <a href="/deposit"><m-icon name="plus"></m-icon> Deposit</a>
                  <a href="/withdraw"><m-icon name="minus"></m-icon> Withdraw</a>
                  <a href="/voting"><m-icon name="like"></m-icon> Voting</a>
                  <a href="/spotlight"><m-icon name="diamond"></m-icon> Spotlight</a>
                  <m-menu class="push">
                    <m-icon slot="trigger" name="wrench"> Advanced</m-icon>
                    <div slot="items" class="menuDropDown">
                      <a href="/voting"><m-icon name="like"></m-icon> Voting</a>
                      <a href="/assets"><m-icon name="like"></m-icon> Assets</a>
                      <a href="/liquidity-pools"><m-icon name="like"></m-icon> Pools</a>
                      <a href="/signed-messages"><m-icon name="like"></m-icon> Signed messages</a>
                      <a href="/membership-stats"><m-icon name="like"></m-icon> Membership stats</a>
                      <a href="/vesting-balances"><m-icon name="like"></m-icon> Vesting balances</a>
                      <a href="/whitelist"><m-icon name="like"></m-icon> Whitelist</a>
                      <a href="/permissions"><m-icon name="like"></m-icon> Permissions</a>
                    </div>
                  </m-menu>
                  <a href="/settings"><m-icon name="settings"></m-icon> Settings</a>
                  <a href="/accounts"><m-icon name="folder"></m-icon> Accounts</a>
                </div>
              </m-menu>
          </m-container>
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
