---
read_when:
    - Criação de clientes Matrix que renderizam respostas avançadas do OpenClaw
    - Depuração do conteúdo do evento com.openclaw.presentation
summary: Metadados de MessagePresentation do Matrix para clientes compatíveis com o OpenClaw
title: Metadados de apresentação do Matrix
x-i18n:
    generated_at: "2026-07-12T14:58:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

O OpenClaw anexa metadados `MessagePresentation` normalizados aos eventos `m.room.message` de saída do Matrix na chave de conteúdo `com.openclaw.presentation`.

Os clientes Matrix padrão continuam renderizando o `body` em texto simples. Clientes compatíveis com o OpenClaw podem ler os metadados estruturados e renderizar uma interface nativa, como botões, seletores, linhas de contexto e divisores.

## Conteúdo do evento

```json
{
  "msgtype": "m.text",
  "body": "Selecionar modelo\n\nEscolha o modelo:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Selecionar modelo",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Escolha o modelo",
        "options": [
          {
            "label": "DeepSeek",
            "value": "/model deepseek/deepseek-chat"
          }
        ]
      }
    ]
  }
}
```

- `version` é a versão do esquema de metadados; a versão atual é `1`. `type` é um discriminador estável, sempre `"message.presentation"`. O adaptador do Matrix emite somente cargas com exatamente essa versão e esse tipo; da mesma forma, os clientes devem ignorar versões desconhecidas que não possam interpretar com segurança, valores de `type` desconhecidos e tipos de bloco desconhecidos.
- `title` e `tone` (`info`, `success`, `warning`, `danger`, `neutral`) são indicações opcionais.
- Botões e opções de seleção podem conter uma `action` tipada (`{ "type": "command", "command": "/..." }` ou `{ "type": "callback", "value": "..." }`) junto com a string legada `value`. Quando ambas estiverem presentes, prefira `action`.

## Comportamento de fallback

O OpenClaw sempre renderiza um fallback legível em texto simples no `body`. Os metadados estruturados são adicionais e não devem ser necessários para a interoperabilidade básica com o Matrix.

Regras de renderização do fallback:

- O conteúdo de `title`, `text` e `context` é renderizado como linhas simples.
- Botões com uma ação `command` são renderizados como ``label: `/command` `` para que o comando possa ser copiado. Botões com uma ação `callback` ou somente um `value` legado são renderizados apenas com o rótulo, para que valores opacos de callback permaneçam privados; botões desabilitados são sempre renderizados apenas com o rótulo. Botões de URL e aplicativos Web são renderizados como `label: URL`.
- Blocos de seleção renderizam o texto de preenchimento (ou `Options:`) como um cabeçalho, seguido por linhas de opções somente com os rótulos.
- Se nada for renderizado, por exemplo, em uma apresentação somente com divisores, o corpo usa `---` como fallback.

Clientes sem suporte continuam exibindo o texto de fallback. Clientes compatíveis com o OpenClaw podem preferir os metadados estruturados para exibição, preservando o fallback para cópia, pesquisa, notificações e acessibilidade.

## Blocos compatíveis

O adaptador de saída do Matrix anuncia suporte nativo a:

- `buttons`
- `select`
- `context`
- `divider`

Blocos `text` sempre são compatíveis por meio do corpo de fallback. Trate todos os blocos como indicações de apresentação de melhor esforço; ignore campos e tipos de bloco desconhecidos em vez de rejeitar toda a mensagem.

## Interações

Esses metadados não adicionam semântica de callback ao Matrix. Os valores de botões e seletores são cargas de interação de fallback, geralmente comandos de barra ou comandos de texto. Um cliente Matrix que queira oferecer suporte a interações resolve o valor do controle (`action.command`, depois `action.value` e, por fim, `value`) e o envia de volta à sala como uma mensagem normal.

Por exemplo, um botão com o valor `/model deepseek/deepseek-chat` pode ser processado enviando esse valor como uma mensagem de texto criptografada do Matrix na mesma sala.

## Relação com os metadados de aprovação

`com.openclaw.presentation` destina-se à apresentação geral de mensagens avançadas.

As solicitações de aprovação usam os metadados dedicados `com.openclaw.approval`, pois as aprovações contêm estados sensíveis à segurança, decisões e detalhes de execução/Plugin. Se as duas chaves de metadados estiverem presentes no mesmo evento, os clientes devem preferir o renderizador dedicado de aprovações.

## Mensagens de mídia

Quando uma resposta contém várias URLs de mídia, o OpenClaw envia um evento Matrix para cada URL de mídia. O texto da legenda e os metadados de apresentação são anexados somente ao primeiro evento, para que os clientes recebam uma carga estruturada estável sem renderizadores duplicados. A mesma regra se aplica quando textos longos são divididos entre eventos: os metadados acompanham somente o primeiro evento.

Mantenha os metadados de apresentação compactos. Textos extensos visíveis ao usuário devem permanecer no `body` e usar o fluxo normal de divisão de texto do Matrix.
