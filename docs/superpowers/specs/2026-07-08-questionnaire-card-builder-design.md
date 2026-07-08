# 问卷车卡设计

日期：2026-07-08

## 背景

当前应用是 Vite + React 的静态角色卡工具，主要数据存放在 `src/data/*.json`，主界面通过资源库选择或“随机生成”填充境界、出身、道源、法门、大道、因果与四项属性。右侧工具栏现在有“建卡指引”弹窗。

本次功能将“建卡指引”替换为“问卷车卡”。玩家从主界面进入 `/wj`，在同一页自上而下回答单选和多选题，提交后回到主界面并得到一张可用的角色卡。

## 范围

本次实现包含：

- 将右侧“建卡指引”按钮改为“问卷车卡”，点击跳转 `/wj`。
- 新增 `/wj` 玩家问卷页。
- 在 `src/data/questionnaire/` 下新增问卷 JSON 与 README。
- 问卷草稿自动保存到 `localStorage`，直到提交后清除草稿。
- 提交后统计题目映射结果，写入主界面可读取的问卷结果，并跳回 `/`。
- 主界面启动时读取问卷结果，填充随机生成同一批可填属性：境界、出身、道源、法门、大道、因果与天赋/天谴。
- 四项角色属性“仙躯、身法、神魂、灵蕴”不由问卷决定，问卷提交回主界面后统一为 `0`。

本次不包含：

- `/wj/admin` 管理页。
- 前端密码保护。
- 后端配置保存、账号系统或远程数据库。
- 通过问卷设置四项角色属性。

## 数据结构

问卷配置放在 `src/data/questionnaire/`：

- `questions.json`：题目、选项、题型与映射。
- `README.md`：说明如何新增题目、修改选项、配置映射。

`questions.json` 采用显式结构：

```json
{
  "version": 1,
  "title": "问卷车卡",
  "description": "回答这些问题，生成一张可用的逆命仙途角色卡。",
  "questions": [
    {
      "id": "source-temper",
      "title": "你更倾向用什么方式面对困境？",
      "type": "single",
      "mapsTo": "source",
      "options": [
        {
          "id": "growth",
          "label": "稳扎稳打，保留后劲",
          "targets": ["木道源", "土道源"]
        }
      ]
    }
  ]
}
```

允许的 `type` 为 `single` 或 `multiple`。允许的 `mapsTo` 为随机生成会触达的属性键：

- `realm`：境界
- `origin`：出身
- `source`：道源
- `method`：法门
- `dao`：大道
- `fate`：逆命因果

每个选项的 `targets` 是该属性下一个或多个具体子类名称，例如 `["木道源", "金道源"]`。名称必须与现有数据 JSON 中的 `name` 或因果标题完全一致。

## 统计规则

提交时按 `mapsTo` 分组统计所有已选选项的 `targets`：

- 单选题只统计被选中的一个选项。
- 多选题统计所有被选中的选项。
- 一个选项可以给同一属性下多个子类各加 1 票。
- 每个属性取票数最高的具体子类。
- 如果最高票相同，取最先达到最高票的子类，也就是按问卷题目和选项顺序中的第一个。
- 如果某个属性没有任何票数，则使用该属性的第一个可用默认值，保证返回主界面后卡面可用。

`fate` 映射到因果标题，例如 `平平无奇`、`天命壹`、`逆命贰`。若问卷结果指定了因果，主界面使用和随机生成相同的抽卡方案逻辑为该因果生成天赋/天谴。若未指定，默认 `平平无奇`。

## 页面和交互

主界面：

- 工具栏按钮文字、标题和辅助标签从“建卡指引”改为“问卷车卡”。
- 点击按钮直接导航到 `/wj`。
- 原 `BuildGuidePopover` 和 `buildGuide.json` 不再作为入口展示；可在实现中删除未使用代码，或保留数据文件但不再导入。

`/wj` 玩家问卷页：

- 使用同一 React 入口，根据 `window.location.pathname` 渲染问卷页或主界面。
- 保持主页面视觉语言：灰底、白纸、深色标题/按钮、绿色主操作、紧凑纸面布局。
- 问卷为单页纵向表单，题目从上到下排列。
- 只有单选和多选控件。
- 每题展示题号、问题标题、可选项和是否必答状态。
- 自动保存草稿到 `localStorage`，刷新或中途离开后回到 `/wj` 可以恢复。
- 顶部提供返回主界面的次要按钮；未提交返回不会清除草稿。
- 提交时校验必答题；缺失时在对应题目上显示错误状态并滚动到第一处错误。
- 提交成功后写入问卷结果，清除草稿，跳转 `/`。

主界面接收结果：

- App 首次加载时检查问卷结果。
- 如果存在结果，将其应用到 `selections`、`selectedFateTitle`、`diceEffects`、`drawnTalents`。
- `attributes` 设置为 `{ "仙躯": "0", "身法": "0", "神魂": "0", "灵蕴": "0" }`。
- 应用成功后清除问卷结果，避免刷新重复覆盖玩家后续手动修改。
- 展示短 toast：“问卷车卡完成！”。

## 持久化键

使用两个 `localStorage` 键：

- `nmxt.questionnaire.draft.v1`：玩家尚未提交的问卷答案。
- `nmxt.questionnaire.result.v1`：提交后等待主界面消费的结果。

草稿只保存题目答案，不保存派生后的角色卡结果。结果保存的是标准化后的属性键与具体名称，例如：

```json
{
  "version": 1,
  "createdAt": "2026-07-08T00:00:00.000Z",
  "selections": {
    "realm": "练气前期",
    "origin": "宗门弟子",
    "source": "木道源",
    "method": "剑修",
    "dao": "守正之道",
    "fate": "平平无奇"
  }
}
```

## Implementation Notes

Create a pure helper module for questionnaire behavior so it can be tested without React:

- `resolveQuestionnaireResult({ questionnaire, libraries })`
- `createQuestionnaireCardState({ result, options, fateDraws, drawPlan })`
- `load/save/clear` helpers may stay small and UI-local, but vote counting and card-state creation should be testable.

The `libraries` object maps `realm/origin/source/method/dao/fate` to valid names. Invalid target names are ignored rather than crashing the UI; README should tell editors to keep names exact. If all targets for an attribute are invalid, fallback selects the first valid option for that attribute.

## Tests

Add focused Vitest coverage before implementation:

- Resolves a single-choice mapping to the highest voted target.
- Resolves multiple-choice mappings and counts all selected option targets.
- Breaks ties by first encountered target.
- Ignores invalid target names and falls back when needed.
- Builds main-page card state from questionnaire result.
- Ensures questionnaire-generated four attributes are all `"0"`.

Build verification:

- `npm test`
- `npm run build`

Manual browser verification:

- Start the Vite dev server.
- Visit `/wj`, answer several questions, refresh, verify draft persists.
- Submit and verify redirect to `/`.
- Verify selected resource fields are filled and four attributes are `0`.
- Verify the toolbar button says “问卷车卡” and navigates to `/wj`.

## Open Decisions

No open decisions remain for this iteration. The admin page is intentionally deferred in favor of JSON-managed configuration under `src/data/questionnaire/`.
