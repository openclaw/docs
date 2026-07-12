---
read_when:
    - Como criar clientes Matrix que renderizam respostas avançadas do OpenClaw
    - Depuração do conteúdo do evento com.openclaw.presentation
summary: Metadados de MessagePresentation do Matrix para clientes compatíveis com o OpenClaw
title: Metadados de apresentação do Matrix
x-i18n:
    generated_at: "2026-07-11T23:45:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c0de4d13c6cefc6f91dcc7a4b0edeea6bf001f3bd71f52c9f0498ad422783d8a
    source_path: channels/matrix-presentation.md
    workflow: 16
---

OpenClaw anexa metadados `MessagePresentation` normalizados aos eventos `m.room.message` de saída do Matrix na chave de conteúdo `com.openclaw.presentation`.

Os clientes Matrix padrão continuam renderizando o texto simples de `body`. Clientes compatíveis com OpenClaw podem ler os metadados estruturados e renderizar uma interface nativa, como botões, seletores, linhas de contexto e divisores.

## Conteúdo do evento

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\nChoose model:\n- DeepSeek",
  "com.openclaw.presentation": {
    "version": 1,
    "type": "message.presentation",
    "title": "Select model",
    "tone": "info",
    "blocks": [
      {
        "type": "select",
        "placeholder": "Choose model",
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

- `version` é a versão do esquema de metadados; a versão atual é `1`. `type` é um discriminador estável, sempre `"message.presentation"`. O adaptador do Matrix emite apenas cargas com exatamente essa versão e esse tipo; da mesma forma, os clientes devem ignorar versões desconhecidas que não possam interpretar com segurança, valores de `type` desconhecidos e tipos de bloco desconhecidos.
- `title` e `tone` (`info`, `success`, `warning`, `danger`, `neutral`) são indicações opcionais.
- Botões e opções de seleção podem conter uma `action` tipada (`{ "type": "command", "command": "/..." }` ou `{ "type": "callback", "value": "..." }`) junto à string legada `value`. Prefira `action` quando ambas estiverem presentes.

## Comportamento de fallback

O OpenClaw sempre renderiza em `body` um fallback de texto simples legível. Os metadados estruturados são adicionais e não devem ser obrigatórios para a interoperabilidade básica com o Matrix.

Regras de renderização do fallback:

- O conteúdo de `title`, `text` e `context` é renderizado como linhas de texto simples.
- Botões com uma ação `command` são renderizados como ``rótulo: `/comando` ``, para que o comando possa ser copiado. Botões com uma ação `callback` ou apenas um `value` legado são renderizados somente com o rótulo, para que valores opacos de callback permaneçam privados; botões desabilitados são sempre renderizados somente com o rótulo. Botões de URL e de aplicativo web são renderizados como `rótulo: URL`.
- Blocos de seleção renderizam o texto indicativo (ou `Opções:`) como título, seguido de linhas de opções contendo somente os rótulos.
- Se nada for renderizado, por exemplo, em uma apresentação que contenha apenas um divisor, o corpo usa `---` como fallback.

Clientes sem suporte continuam exibindo o texto de fallback. Clientes compatíveis com OpenClaw podem preferir os metadados estruturados para exibição, preservando o fallback para cópia, pesquisa, notificações e acessibilidade.

## Blocos compatíveis

O adaptador de saída do Matrix anuncia suporte nativo a:

- `buttons`
- `select`
- `context`
- `divider`

Blocos `text` sempre são compatíveis por meio do corpo de fallback. Trate todos os blocos como indicações de apresentação de melhor esforço; ignore campos e tipos de bloco desconhecidos em vez de rejeitar a mensagem inteira.

## Interações

Esses metadados não adicionam semântica de callback ao Matrix. Os valores de botões e seletores são cargas de interação de fallback, geralmente comandos de barra ou comandos de texto. Um cliente Matrix que queira oferecer suporte à interação resolve o valor do controle (`action.command`, depois `action.value` e, por fim, `value`) e o envia de volta à sala como uma mensagem normal.

Por exemplo, um botão com o valor `/model deepseek/deepseek-chat` pode ser processado enviando esse valor como uma mensagem de texto criptografada do Matrix na mesma sala.

## Relação com os metadados de aprovação

`com.openclaw.presentation` destina-se à apresentação geral de mensagens avançadas.

Solicitações de aprovação usam os metadados dedicados `com.openclaw.approval`, pois as aprovações contêm estado sensível à segurança, decisões e detalhes de execução/Plugin. Se ambas as chaves de metadados estiverem presentes no mesmo evento, os clientes devem preferir o renderizador dedicado de aprovação.

## Mensagens de mídia

Quando uma resposta contém vários URLs de mídia, o OpenClaw envia um evento do Matrix para cada URL de mídia. O texto da legenda e os metadados de apresentação são anexados apenas ao primeiro evento, para que os clientes recebam uma única carga estruturada estável, sem renderizadores duplicados. A mesma regra se aplica quando um texto longo é dividido entre eventos: os metadados acompanham somente o primeiro evento.

Mantenha os metadados de apresentação compactos. Textos extensos visíveis ao usuário devem permanecer em `body` e usar o fluxo normal de divisão de texto do Matrix.
