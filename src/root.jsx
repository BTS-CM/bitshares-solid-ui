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
        <script defer src="https://unpkg.com/m-@1.4.0/dist/min.js"></script>
        <Meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <body>
        <header>
          <div class="inline-flex align-items-center">
            <a href="/" class="mar-l-sm mar-r-sm">
              <img src="/bts.png" alt="logo" height="40px" width="30px" />
            </a>
            <m-tabs>
              <a href="/account" class="mar-l-sm mar-r-sm">
                {
                  location.pathname.includes('account')
                    ? <m-tab selected>Portfolio</m-tab>
                    : <m-tab>Portfolio</m-tab>
                }
              </a>
              <a href="/exchange" class="mar-l-sm mar-r-sm">
                {
                  location.pathname.includes('exchange')
                    ? <m-tab selected>Exchange</m-tab>
                    : <m-tab>Exchange</m-tab>
                }
              </a>
              <a href="/credit-offer" class="mar-l-sm mar-r-sm">
                {
                  location.pathname.includes('credit-offer')
                    ? <m-tab selected>Credit Offer</m-tab>
                    : <m-tab>Credit Offer</m-tab>
                }
              </a>
              <a href="/explore" class="mar-l-sm mar-r-sm">
                {
                  location.pathname.includes('explore')
                    ? <m-tab selected>Explore</m-tab>
                    : <m-tab>Explore</m-tab>
                }
              </a>
              <a href={location.pathname}>
                {
                  !['account', 'exchange', 'credit-offer', 'explore'].includes(location.pathname.split('/')[1]) && location.pathname !== '/'
                    ? <m-tab selected>{location.pathname.split('/')[1].split("-").join(" ")}</m-tab>
                    : null
                }
              </a>
            </m-tabs>
            <m-menu>
                <m-icon slot="trigger" name="menu" class="push"></m-icon>
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
                  <a href="/settings"><m-icon name="settings"></m-icon> Settings</a>
                  <a href="/accounts"><m-icon name="folder"></m-icon> Accounts</a>
                  <m-menu>
                    <a><m-icon slot="trigger" name="wrench"> Advanced</m-icon></a>
                    <div slot="items" class="menuDropDown">
                      <a href="/voting"><m-icon name="like"></m-icon> Voting</a>
                      <a href="/assets"><m-icon name="list"></m-icon> Assets</a>
                      <a href="/liquidity-pools"><m-icon name="pie-chart"></m-icon> Pools</a>
                      <a href="/signed-messages"><m-icon name="book-open"></m-icon> Signed messages</a>
                      <a href="/membership-stats"><m-icon name="briefcase"></m-icon> Membership stats</a>
                      <a href="/vesting-balances"><m-icon name="clock"></m-icon> Vesting balances</a>
                      <a href="/whitelist"><m-icon name="list"></m-icon> Whitelist</a>
                      <a href="/permissions"><m-icon name="key"></m-icon> Permissions</a>
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