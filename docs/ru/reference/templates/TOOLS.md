---
read_when:
    - Инициализация рабочей области вручную
summary: Шаблон рабочей области для TOOLS.md
title: Шаблон TOOLS.md
x-i18n:
    generated_at: "2026-06-28T23:45:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 810b088129bfd963ffe603a7e0a07d099fd2551bf13ebcb702905e1b8135d017
    source_path: reference/templates/TOOLS.md
    workflow: 16
---

# TOOLS.md - Локальные заметки

Skills определяют, _как_ работают инструменты. Этот файл предназначен для _ваших_ особенностей — того, что уникально для вашей настройки.

## Что здесь указывать

Например:

- Названия и расположение камер
- SSH-хосты и псевдонимы
- Предпочитаемые голоса для TTS
- Названия колонок/комнат
- Псевдонимы устройств
- Любые особенности конкретного окружения

## Примеры

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

## Зачем разделять?

Skills являются общими. Ваша настройка принадлежит вам. Разделение позволяет обновлять Skills без потери ваших заметок и делиться Skills без раскрытия вашей инфраструктуры.

---

Добавьте всё, что помогает вам работать. Это ваша шпаргалка.

## См. также

- [Рабочая область агента](/ru/concepts/agent-workspace)
