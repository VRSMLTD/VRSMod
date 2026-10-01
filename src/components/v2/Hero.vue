<template>
    <section :class="['c-hero', heroTypeClass, { 'c-hero--centered': heroProps.centered }]" ref="section">
        <div class="c-hero__container">
            <span class="c-hero__accent" aria-hidden="true"></span>
            <div class="c-hero__text">
                <h1 class="c-hero__title" ref="title">
                    {{ title }}
                </h1>
                <h2 class="c-hero__subtitle" ref="subtitle">
                    {{ subtitle }}
                </h2>
            </div>
        </div>
    </section>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

interface HeroProps {
    title: string;
    subtitle: string;
    heroType: 'primary' | 'warning';
    centered?: boolean;
}

const heroProps = withDefaults(defineProps<HeroProps>(), {
  heroType: 'primary',
  centered: false
});

const heroTypeClass = computed(() => {
    if (heroProps.heroType == undefined) {
        return '';
    }
    switch (heroProps.heroType) {
        case 'primary':
            return 'c-hero--primary';
        case 'warning':
            return 'c-hero--warning';
    }
});
</script>

<style lang="scss" scoped>
.c-hero {

    padding: 1.5rem 2rem;
    background-color: var(--background);
    border-bottom: 1px solid var(--border);

    &__container {
        max-width: 1344px;
        display: flex;
        align-items: stretch;
        gap: 1rem;
    }

    &--centered &__container {
        margin: 0 auto;
    }

    &__accent {
        flex-shrink: 0;
        width: 4px;
        border-radius: 2px;
        background-color: var(--scheme-primary);
    }

    &__text {
        min-width: 0;
    }

    &__title {
        // Display as inline due to current CSS imports margins taking precedence.
        // This is solved by being wrapped in a div.
        display: block;
        user-select: none;
        font-size: 1.5rem;
        font-weight: 700;
        line-height: 1.2;
        word-break: break-word;
        margin-bottom: 0.25rem;
        color: var(--text-strong, var(--text));
    }

    &__subtitle {
        display: block;
        line-height: 1.4;
        font-size: 0.95rem;
        color: var(--text-secondary, var(--text));
    }

    &--warning &__accent {
        background-color: var(--v2-warning-background-color);
    }
}

</style>
