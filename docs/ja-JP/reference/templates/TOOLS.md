---
read_when:
    - workspaceを手動でブートストラップする
summary: TOOLS.md のworkspaceテンプレート
title: TOOLS.md テンプレート
x-i18n:
    generated_at: "2026-04-24T05:20:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 15
---

# TOOLS.md - ローカルメモ

Skills は、ツールが_どう動くか_を定義します。このファイルは、_あなたの_固有情報のためのものです — あなたの環境に特有な内容です。

## ここに入れるもの

たとえば次のようなものです:

- カメラ名と設置場所
- SSHホストとエイリアス
- TTS用の好みのvoice
- スピーカー/部屋名
- デバイスのニックネーム
- その他、環境固有のものすべて

## 例

```markdown
### Cameras

- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH

- home-server → 192.168.1.100, user: admin

### TTS

- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## なぜ分けるのか？

Skillsは共有されます。あなたの設定はあなたのものです。これらを分けておけば、メモを失わずにSkillsを更新でき、インフラを漏らさずにSkillsを共有できます。

---

仕事に役立つことは何でも追加してください。これはあなたのチートシートです。

## 関連

- [Agent workspace](/ja-JP/concepts/agent-workspace)
