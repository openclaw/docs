---
read_when:
    - 运行仓库中的脚本
    - 添加或修改 `./scripts` 下的脚本
summary: 仓库脚本：用途、范围和安全说明
title: 脚本
x-i18n:
    generated_at: "2026-04-05T08:25:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: de53d64d91c564931bdd4e8b9f4a8e88646332a07cc2a6bf1d517b89debb29cd
    source_path: help/scripts.md
    workflow: 15
---

# 脚本

`scripts/` 目录包含用于本地工作流和运维任务的辅助脚本。
当任务明确对应某个脚本时，请使用这些脚本；否则优先使用 CLI。

## 约定

- 脚本是**可选**的，除非文档或发布清单中明确引用。
- 当存在 CLI surface 时，优先使用 CLI（例如：鉴权监控使用 `openclaw models status --check`）。
- 假定脚本具有宿主机特定性；在新机器上运行前先阅读它们。

## 鉴权监控脚本

鉴权监控已在[鉴权](/gateway/authentication)中说明。`scripts/` 下的脚本是 systemd/Termux 手机工作流的可选补充。

## 添加脚本时

- 保持脚本聚焦且有文档说明。
- 在相关文档中添加简短条目（如果缺失则创建）。
