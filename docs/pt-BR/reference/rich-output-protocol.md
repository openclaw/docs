---
read_when:
    - Alterando a renderização da saída do assistente na Control UI
    - Depuração de `[embed ...]`, mídia estruturada, resposta ou diretivas de apresentação de áudio
summary: Protocolo de saída rica para mídia estruturada, incorporações, dicas de áudio e respostas
title: Protocolo de saída rica
x-i18n:
    generated_at: "2026-06-27T18:09:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f5915f0ba29e6b0d27c99b1c7fdc632f1b58a4d96eae26bf6670205bd4fb88b1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

A saída do assistente pode carregar um pequeno conjunto de diretivas de entrega/renderização:

- campos estruturados `mediaUrl` / `mediaUrls` para entrega de anexos
- `[[audio_as_voice]]` para dicas de apresentação de áudio
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadados de resposta
- `[embed ...]` para renderização rica da Control UI

Anexos de mídia remota devem ser URLs `https:` públicas. `http:` simples,
loopback, link-local, nomes de host privados e internos são ignorados como diretivas
de anexo; os buscadores de mídia do lado do servidor ainda aplicam suas próprias proteções de rede.

Anexos de mídia local podem usar caminhos absolutos, caminhos relativos ao workspace ou
caminhos relativos ao diretório inicial `~/`. Eles ainda passam pela política de leitura de arquivos do agente e por
verificações de tipo de mídia antes da entrega.

<Warning>
Não emita comandos de texto para anexos de ferramentas, plugins, blocos de streaming,
saída do navegador ou ações de mensagem. Use campos de mídia estruturados.

Payload válido da ferramenta de mensagens:

```json
{ "message": "Here is your image.", "mediaUrl": "/workspace/image.png" }
```

O texto legado da resposta final do assistente ainda pode ser normalizado por compatibilidade, mas
não é um protocolo geral de plugin/ferramenta.
</Warning>

A sintaxe simples de imagem em Markdown permanece texto por padrão. Canais que intencionalmente
mapeiam respostas de imagem em Markdown para anexos de mídia aderem a isso no adaptador de saída;
o Telegram faz isso para que `![alt](url)` ainda possa se tornar uma resposta de mídia.

Essas diretivas são separadas. Campos de mídia estruturados e tags de resposta/voz são
metadados de entrega; `[embed ...]` é o caminho de renderização rica exclusivo da web.

Quando o streaming de blocos está habilitado, a mídia deve ser carregada em campos de payload
estruturados. Se a mesma URL de mídia for enviada em um bloco em streaming e repetida no
payload final do assistente, o OpenClaw entrega o anexo uma vez e remove a
duplicata do payload final.

## `[embed ...]`

`[embed ...]` é a única sintaxe de renderização rica voltada para agentes para a Control UI.

Exemplo de autofechamento:

```text
[embed ref="cv_123" title="Status" /]
```

Regras:

- `[view ...]` não é mais válido para novas saídas.
- Shortcodes de embed são renderizados apenas na superfície de mensagem do assistente.
- Apenas embeds baseados em URL são renderizados. Use `ref="..."` ou `url="..."`.
- Shortcodes de embed de HTML inline em forma de bloco não são renderizados.
- A interface web remove o shortcode do texto visível e renderiza o embed inline.
- Mídia estruturada não é um alias de embed e não deve ser usada para renderização de embed rico.

## Formato de renderização armazenado

O bloco de conteúdo do assistente normalizado/armazenado é um item `canvas` estruturado:

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

Blocos ricos armazenados/renderizados usam esse formato `canvas` diretamente. `present_view` não é reconhecido.

## Relacionados

- [Adaptadores RPC](/pt-BR/reference/rpc)
- [Typebox](/pt-BR/concepts/typebox)
