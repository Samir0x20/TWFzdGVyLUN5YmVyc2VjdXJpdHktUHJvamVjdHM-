<script>
  import "../app.postcss";
  import "../assets/css/app.css";
  import { onMount } from "svelte";
  import { user } from "@stores/auth";
  import { cart } from "@stores/cart";
  import Toasts from "@interfaces/toasts/Toasts.svelte";
  import Cart from "@interfaces/cart/Cart.svelte";
  import {recommendation} from "@stores/recommendation";
  import { goto } from "$app/navigation";
  import axios from "axios";
  import { env } from "$env/dynamic/public";

  export const ssr = false;

  const gateway = env.PUBLIC_API_GATEWAY_URL;

  onMount(async () => {
    // Initialize stored auth session
    const token = sessionStorage.getItem('token');
    if (token) {
      try {
        
        // Verify token and set user data
        const response = await axios.get(`${gateway}/verify/${token}`);
        if (response.status === 200) {
          const username = response.data.username;
          const isAdmin = response.data.isAdmin;
          user.set({ isLogged: true, isAdmin, username, token });

          // Get cart data after initializing user session
          const cartResponse = await axios.get(`${gateway}/cart/${username}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const cartData = cartResponse.data.cart;
          cart.setCart(cartData);

          // Get recommendations
          const recommendationsResponse = await axios.get(`${gateway}/recommendation`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          const recommendations = recommendationsResponse.data.recommendation;
          recommendation.setRecommendations(recommendations);
          

        }else{
          user.set({ isLogged: false, isAdmin: false, username: '', token: '' });
          sessionStorage.removeItem('token');
          goto("/login");
        }
        
      } catch (err) {
        console.error("Failed to verify token or load data", err);
      }
     
    }
  });

  async function logout() {
    const token = sessionStorage.getItem('token');
    try {
      await axios.post(`${gateway}/logout`, {username: $user.username, token: token});
      user.set({ isLogged: false, isAdmin: false, username: '', token: '' });
      sessionStorage.removeItem('token');
      goto("/login/");
    } catch (err) {
      console.error("Failed to logout", err);
    }
    window.location.reload();
  }

  function reloadPage(event) {
    event.preventDefault();
		window.location.href = event.currentTarget.href;
  }
</script>

<Toasts />

<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <div class="container px-4 px-lg-5">
    <a class="navbar-brand" href="#!">Scapp</a>
    <div class="navbar-collapse">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
        <li class="nav-item">
          <a class="nav-link active" aria-current="page" href="/" on:click={reloadPage}>Home</a>
        </li>
        {#if $user.isAdmin}
          <li class="nav-item"><a class="nav-link" href="/admin" on:click={reloadPage}>Admin</a></li>
        {/if}
        {#if !$user.isLogged}
          <li class="nav-item">
            <a class="nav-link" href="/register" on:click={reloadPage}>Register</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/login" on:click={reloadPage}>Sign in</a>
          </li>
        {:else}
          <li class="nav-item">
            <a class="nav-link" href="/checkout" on:click={reloadPage}>Checkout</a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="/" on:click|preventDefault={logout}>Logout</a>
          </li>
        {/if}
      </ul>

      {#if $user.isLogged}
        <Cart />
      {/if}
    </div>
  </div>
</nav>

<slot />
