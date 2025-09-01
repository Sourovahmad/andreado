<script lang="ts">
  import { locale, locales } from 'svelte-i18n';
  
  const languageOptions = [
    { value: 'en', label: '🇺🇸 English' },
    { value: 'it', label: '🇮🇹 Italiano' }
  ];
  
  function handleLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    $locale = target.value;
  }
</script>

<div class="language-switcher">
  <select 
    bind:value={$locale} 
    on:change={handleLanguageChange}
    class="px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  >
    {#each languageOptions as option}
      <option value={option.value}>{option.label}</option>
    {/each}
  </select>
</div>

<style>
  .language-switcher {
    display: flex;
    align-items: center;
  }
  
  select {
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  select:hover {
    border-color: #3b82f6;
  }
</style>
