---
read_when:
    - Alterar a renderização da saída do assistente na UI de controle
    - Depurar diretivas de apresentação de `[embed ...]`, `MEDIA:`, resposta ou áudio
summary: Protocolo de shortcodes de saída avançada para embeds, mídia, dicas de áudio e respostas
title: Protocolo de saída avançada
x-i18n:
    generated_at: "2026-04-23T14:07:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 566338ac0571c6ab9062c6bad0bc4f71fe65249a3fcd9d8e575affcd93db11e7
    source_path: reference/rich-output-protocol.md
    workflow: 15
---

# Protocolo de saída avançada

A saída do assistente pode carregar um pequeno conjunto de diretivas de entrega/renderização:

- `MEDIA:` para entrega de anexo
- `[[audio_as_voice]]` para dicas de apresentação de áudio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadados de resposta
- `[embed ...]` para renderização avançada na UI de controle

Essas diretivas são separadas. `MEDIA:` e tags de resposta/voz continuam sendo metadados de entrega; `[embed ...]` é o caminho de renderização avançada exclusivo da web.

## `[embed ...]`

`[embed ...]` é a única sintaxe de renderização avançada voltada ao agente para a UI de controle.

Exemplo autoencerrado:

```text
[embed ref="cv_123" title="Status" /]
```

Regras:

- `[view ...]` não é mais válido para nova saída.
- Shortcodes de embed são renderizados apenas na superfície de mensagem do assistente.
- Apenas embeds com suporte de URL são renderizados. Use `ref="..."` ou `url="..."`.
- Shortcodes de embed em HTML inline no formato de bloco não são renderizados.
- A UI web remove o shortcode do texto visível e renderiza o embed inline.
- `MEDIA:` não é um alias de embed e não deve ser usado para renderização avançada de embed.

## Formato de renderização armazenado

O bloco normalizado/armazenado de conteúdo do assistente é um item `canvas` estruturado:

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
