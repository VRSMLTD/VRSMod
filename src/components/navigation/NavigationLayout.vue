<template>
    <div id="content">
        <div class="nav-column non-selectable">
            <NavigationMenu />
        </div>
        <div class="content-column">
            <router-view />
        </div>
        <GameRunningModal :activeGame="store.state.activeGame" />
    </div>
</template>

<script lang="ts" setup>

import NavigationMenu from './NavigationMenu.vue';
import GameRunningModal from '../modals/GameRunningModal.vue';
import { getStore } from '../../providers/generic/store/StoreProvider';
import { State } from '../../store';

const store = getStore<State>();

</script>

<style>
.nav-column {
    background-color: var(--surface, inherit);
    border-right: 1px solid var(--border);
}

.content-column {
    display: flex;
    flex: 1;
    padding: 0;
    margin-left: 0.75rem;
    overflow: hidden;
    overflow-y: hidden;
    width: 100%;
}

#content {
    padding: 0;
    max-width: 100vw;
    display: flex;
    flex: 1;
}
</style>
