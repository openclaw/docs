---
read_when:
    - Criando clientes Matrix que renderizam respostas ricas do OpenClaw
    - Depuração do conteúdo do evento com.openclaw.presentation
summary: Metadados do MessagePresentation do Matrix para clientes compatíveis com OpenClaw
title: Metadados de apresentação da matriz
x-i18n:
    generated_at: "2026-05-10T19:22:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: c89979b6007faaa6af44c7f2511f354b96f163bcd3d5e7f99c405b51c4950537
    source_path: channels/matrix-presentation.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw pode anexar metadados `MessagePresentation` normalizados a eventos Matrix `m.room.message` de saída em `com.openclaw.presentation`.

Clientes Matrix padrão continuam renderizando o `body` em texto simples. Clientes compatíveis com OpenClaw podem ler os metadados estruturados e renderizar uma UI nativa, como botões, seletores, linhas de contexto e divisores.

## Conteúdo do evento

Os metadados são armazenados no conteúdo do evento Matrix:

```json
{
  "msgtype": "m.text",
  "body": "Select model\n\n- DeepSeek: /model deepseek/deepseek-chat",
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

`version` é a versão do esquema de metadados de apresentação do Matrix. `type` é um discriminador estável para clientes compatíveis com OpenClaw. Os clientes devem ignorar valores de `type` desconhecidos, versões desconhecidas que não possam interpretar com segurança e tipos de bloco desconhecidos.

## Comportamento alternativo

OpenClaw sempre renderiza uma alternativa legível em texto simples em `body`. Os metadados estruturados são aditivos e não devem ser necessários para a interoperabilidade básica com Matrix.

Clientes sem suporte devem continuar exibindo o texto alternativo. Clientes compatíveis com OpenClaw podem preferir os metadados estruturados para exibição, preservando o texto alternativo para cópia, busca, notificações e acessibilidade.

## Blocos compatíveis

O adaptador de saída Matrix anuncia suporte para:

- `buttons`
- `select`
- `context`
- `divider`

Os clientes devem tratar esses blocos como sugestões de apresentação de melhor esforço. Campos desconhecidos e tipos de bloco desconhecidos devem ser ignorados, em vez de fazer com que a mensagem inteira falhe ao renderizar.

## Interações

Esses metadados não adicionam semântica de callback ao Matrix. Valores de botões e opções de seleção são cargas de interação alternativas, geralmente comandos com barra ou comandos de texto. Um cliente Matrix que queira oferecer suporte a interação pode enviar o valor selecionado de volta para a sala como uma mensagem normal.

Por exemplo, um botão com valor `/model deepseek/deepseek-chat` pode ser tratado enviando esse valor como uma mensagem de texto Matrix criptografada na mesma sala.

## Relação com metadados de aprovação

`com.openclaw.presentation` é para apresentação geral de mensagens ricas.

Prompts de aprovação usam os metadados dedicados `com.openclaw.approval`, porque aprovações carregam estado, decisões e detalhes de execução/Plugin sensíveis à segurança. Se ambas as chaves de metadados estiverem presentes no mesmo evento, os clientes devem preferir o renderizador de aprovação dedicado.

## Mensagens de mídia

Quando uma resposta contém vários URLs de mídia, OpenClaw envia um evento Matrix por URL de mídia. Os metadados de apresentação são anexados apenas ao primeiro evento de mídia, para que os clientes tenham uma carga estruturada estável e renderizadores duplicados sejam evitados.

Mantenha os metadados de apresentação compactos. Textos grandes visíveis ao usuário devem permanecer em `body` e usar o caminho normal de divisão de texto do Matrix.
