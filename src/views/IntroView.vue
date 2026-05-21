<script setup>
import { computed } from 'vue'
import { INTRO_LIMIT } from '../data/constants.js'

const props = defineProps({ project: { type: Object, required: true } })
const len = computed(() => (props.project.intro || '').length)
</script>

<template>
  <div class="page-narrow" style="margin: 0 auto; max-width: 720px">
    <h2 class="section-title">📝 소개글 설정</h2>
    <p class="section-desc">프로젝트(대화 · 세계관)에 대한 소개글을 적어주세요. 다른 사람에게 보여줄 한마디예요.</p>

    <div class="card">
      <label class="field" style="margin-bottom: 0">
        <span class="lab">
          소개글
          <span class="counter" :class="{ over: len > INTRO_LIMIT }">{{ len }} / {{ INTRO_LIMIT }}</span>
        </span>
        <textarea
          v-model="project.intro"
          :maxlength="INTRO_LIMIT"
          rows="8"
          placeholder="이 세계와 캐릭터들에 대해 소개해주세요. (500자)"
        ></textarea>
      </label>
    </div>

    <p class="tiny muted" style="margin-top: 12px">
      💡 첫 줄은 플랫폼 내보내기에서 '한 줄 소개'로 자동 사용돼요.
    </p>
  </div>
</template>
