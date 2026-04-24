---
read_when:
    - Alterar a renderização da saída do assistente na interface do Control
    - Depurar diretivas de apresentação de `[embed ...]`, `MEDIA:`, reply ou áudio
summary: Protocolo de shortcodes de saída avançada para embeds, mídia, dicas de áudio e respostas
title: Protocolo de saída avançada
x-i18n:
    generated_at: "2026-04-24T06:11:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 688d60c97180b4ba250e731d765e8469a01c68588c149b760c32eab77955f69b
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

A saída do assistente pode carregar um pequeno conjunto de diretivas de entrega/renderização:

- `MEDIA:` para entrega de anexos
- `[[audio_as_voice]]` para dicas de apresentação de áudio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadados de resposta
- `[embed ...]` para renderização avançada na interface do Control

Essas diretivas são separadas. `MEDIA:` e tags de resposta/voz continuam sendo metadados de entrega; `[embed ...]` é o caminho de renderização avançada apenas para a web.

## `[embed ...]`

`[embed ...]` é a única sintaxe de renderização avançada voltada ao agente para a interface do Control.

Exemplo autocontido:

```text
[embed ref="cv_123" title="Status" /]
```

Regras:

- `[view ...]` não é mais válido para nova saída.
- Shortcodes de embed são renderizados apenas na superfície de mensagem do assistente.
- Apenas embeds baseados em URL são renderizados. Use `ref="..."` ou `url="..."`.
- Shortcodes de embed em HTML inline no formato de bloco não são renderizados.
- A interface web remove o shortcode do texto visível e renderiza o embed inline.
- `MEDIA:` não é um alias de embed e não deve ser usado para renderização avançada de embed.

## Formato de renderização armazenado

O bloco normalizado/armazenado de conteúdo do assistente é um item estruturado `canvas`:

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

Blocos avançados armazenados/renderizados usam diretamente esse formato `canvas`. `present_view` não é reconhecido.

## Relacionado

- [Adaptadores RPC](/pt-BR/reference/rpc)
- [Typebox](/pt-BR/concepts/typebox)
