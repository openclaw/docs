---
read_when:
    - Alteração da renderização da saída do assistente na interface de controle
    - Depuração de diretivas de apresentação de `[embed ...]`, mídia estruturada, resposta ou áudio
summary: Protocolo de saída avançada para mídia estruturada, incorporações, indicações de áudio e respostas
title: Protocolo de saída avançada
x-i18n:
    generated_at: "2026-07-12T00:20:49Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cbfe68f38c871f5f6d2811eb52b18d0143606f30283023ae96db64543eed95a1
    source_path: reference/rich-output-protocol.md
    workflow: 16
---

A saída do assistente transmite diretivas de entrega/renderização por meio de alguns canais dedicados:

- Campos estruturados `mediaUrl` / `mediaUrls` para entrega de anexos.
- `[[audio_as_voice]]` para indicações de apresentação de áudio.
- `[[reply_to_current]]` / `[[reply_to:<id>]]` para metadados de resposta.
- `[embed ...]` para renderização avançada na interface de controle.

Os campos estruturados de mídia e as tags `[[...]]` são metadados de entrega. `[embed ...]` é o caminho separado de renderização avançada exclusivo para a Web; ele não é um alias de mídia.

## Anexos de mídia

Os anexos remotos devem ser URLs `https:` públicas. URLs `http:`, de local loopback, link-local e privadas, assim como nomes de host internos, são rejeitados como diretivas de anexo; os mecanismos de busca de mídia no servidor aplicam suas próprias proteções de rede adicionalmente.

Os anexos locais aceitam caminhos absolutos, caminhos relativos ao espaço de trabalho ou caminhos `~/` relativos ao diretório pessoal. Eles ainda passam pela política de leitura de arquivos do agente e pelas verificações de tipo de mídia antes da entrega.

<Warning>
Não emita comandos de texto para anexos provenientes de ferramentas, plugins, blocos de streaming, saída do navegador ou ações de mensagem. Em vez disso, use campos estruturados de mídia:

```json
{ "message": "Aqui está sua imagem.", "mediaUrl": "/workspace/image.png" }
```

O texto legado da resposta final ainda pode ser normalizado para compatibilidade, mas isso não constitui um protocolo geral de plugin/ferramenta.
</Warning>

A sintaxe simples de imagem em Markdown (`![alt](url)`) permanece como texto por padrão. Os canais que desejam tratar imagens Markdown como respostas de mídia habilitam essa opção no adaptador de saída; o Telegram faz isso para que `![alt](url)` se torne um anexo de mídia.

Quando o streaming em blocos está habilitado, a mídia deve ser transmitida nos campos estruturados da carga útil. Se a mesma URL de mídia aparecer em um bloco transmitido e novamente na carga útil final do assistente, o OpenClaw a entregará uma vez e removerá a duplicata da carga útil final.

## `[embed ...]`

`[embed ...]` é a única sintaxe de renderização avançada voltada ao agente para a interface de controle. Exemplo de fechamento automático:

```text
[embed ref="cv_123" title="Status" /]
```

Regras:

- `[view ...]` não é mais válido para novas saídas.
- Os códigos curtos de incorporação são renderizados apenas na superfície de mensagens do assistente.
- Somente incorporações vinculadas a URLs são renderizadas; use `ref="..."` ou `url="..."`.
- Códigos curtos de incorporação em HTML embutido no formato de bloco não são renderizados.
- A interface Web remove o código curto do texto visível e renderiza a incorporação em linha.

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

`present_view` não é reconhecido; os blocos avançados armazenados/renderizados sempre usam esse formato `canvas`.

## Relacionado

- [Adaptadores RPC](/pt-BR/reference/rpc)
- [Typebox](/pt-BR/concepts/typebox)
