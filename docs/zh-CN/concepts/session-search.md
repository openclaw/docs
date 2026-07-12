---
read_when:
    - 你需要查找之前某个会话中讨论过的内容
    - 你想了解会话搜索的隐私或索引机制
summary: 搜索过去的会话记录并重新打开匹配的上下文
title: 会话搜索
x-i18n:
    generated_at: "2026-07-12T14:25:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3e9cda6b656b689eef0636592914f4890a64dca5e955aa03908377903aaa29c9
    source_path: concepts/session-search.md
    workflow: 16
---

# 会话搜索

`sessions_search` 会在你自己过去的会话中搜索用户和助手文本。每条结果都包含 `sessionKey`、时间戳、角色和一段简短的匹配摘录。当你需要查看上下文对话时，请将返回的 `sessionKey` 传递给 `sessions_history`。

## 可见性和输出

搜索采用与 `sessions_history` 相同的会话可见性规则。在应用结果数量限制之前，会移除调用方可见会话树之外的结果。启用衍生会话可见性时，沙箱隔离的智能体仍只能访问由其衍生的会话。

摘录会先进行脱敏处理，再返回给模型。结果还会受到数量、摘录长度和响应总大小的限制。

## 索引生命周期

OpenClaw 在每个智能体的 SQLite 数据库中，将全文索引存储在对话记录行旁。新的用户和助手消息会在持久化它们的同一事务中编入索引，因此索引绝不会落后于实时对话；工具结果、推理块和图像不会编入索引。只有对话记录的活动分支可供搜索。

索引创建之前的对话记录（例如由 `openclaw doctor` 导入的会话），以及活动分支已回退的会话，会通过后台协调任务重新编入索引，该任务会在下一次搜索时启动。因此，包含 `indexing: true` 的响应可能不完整；请在索引完成后重试。删除会话时，会在同一事务中移除其索引条目。

搜索目前使用 SQLite 的 Unicode 词语分词器，并移除变音符号。未来将改进为使用三元组分词，以支持 CJK 子字符串匹配。

## 会话搜索与记忆搜索

使用 `sessions_search` 从原始会话对话记录中搜索精确的单词或短语。使用 [`memory_search`](/zh-CN/concepts/memory-search) 搜索持久记忆文件并进行语义回忆。实验性的会话记忆语料库在语义层面补充了这种精确的对话记录搜索。
