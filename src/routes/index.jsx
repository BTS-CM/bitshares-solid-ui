import Counter from "~/components/Counter";
import "./index.css";
export default function Home() {
  return (<>
      <header class="bg-offwhite">
      <m-container class="flex">       
        <nav class="mar-l-lg">
          <a href="#" class="mar-l-sm mar-r-sm">
            <img src="/bts.png" alt="logo" height="40px" width="30px" />
          </a>
          <a href="#" class="mar-l-sm mar-r-sm vertAlign">Portfolio</a>
          <a href="#" class="mar-l-sm mar-r-sm vertAlign">Exchange</a>
          <a href="#" class="mar-l-sm mar-r-sm vertAlign">Credit Offer</a>
          <a href="#" class="mar-l-sm mar-r-sm vertAlign">Explore</a>
        </nav>
        <m-menu class="push">
            <button slot="trigger" ord="secondary">
              <m-icon name="menu"></m-icon>
            </button>
            <div slot="items" class="menuDropDown">
              <a href><m-icon name="login"></m-icon> Login</a>
              <a href><m-icon name="wallet"></m-icon> Portfolio</a>
              <a href><m-icon name="chart"></m-icon> Exchange</a>
              <a href><m-icon name="support"></m-icon> Credit Offer</a>
              <a href><m-icon name="diamond"></m-icon> Liquidity Pools</a>
              <a href><m-icon name="magnifier"></m-icon> Explore</a>
              <a href><m-icon name="paper-plane"></m-icon> Send</a>
              <a href><m-icon name="plus"></m-icon> Deposit</a>
              <a href><m-icon name="minus"></m-icon> Withdraw</a>
              <a href><m-icon name="like"></m-icon> Voting</a>
              <a href><m-icon name="diamond"></m-icon> Spotlight</a>
              <m-menu class="push">
                <m-icon slot="trigger" name="wrench"> Advanced</m-icon>
                <div slot="items" class="menuDropDown">
                  <a href><m-icon name="like"></m-icon> Voting</a>
                  <a href><m-icon name="like"></m-icon> Assets</a>
                  <a href><m-icon name="like"></m-icon> Pools</a>
                  <a href><m-icon name="like"></m-icon> Signed messages</a>
                  <a href><m-icon name="like"></m-icon> Membership stats</a>
                  <a href><m-icon name="like"></m-icon> Vesting balances</a>
                  <a href><m-icon name="like"></m-icon> Whitelist</a>
                  <a href><m-icon name="like"></m-icon> Permissions</a>
                </div>
              </m-menu>
              <a href><m-icon name="settings"></m-icon> Settings</a>
              <a href><m-icon name="folder"></m-icon> Accounts</a>
            </div>
          </m-menu>
      </m-container>
    </header>
    <main>
      <m-row>
          <m-col span="4">
              <m-box>These two columns...</m-box>
          </m-col>
          <m-col span="8">
              <m-box>...span an explicit number of columns (4 and 8).</m-box>
          </m-col>
      </m-row>
    </main>
  </>
  );
}