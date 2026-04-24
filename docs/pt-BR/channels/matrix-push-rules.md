---
read_when:
    - Configurando streaming discreto do Matrix para Synapse ou Tuwunel auto-hospedado
    - Os usuários querem notificações apenas nos blocos finalizados, não em cada edição de pré-visualização
summary: Regras de push do Matrix por destinatário para edições discretas de pré-visualização finalizadas
title: Regras de push do Matrix para pré-visualizações discretas
x-i18n:
    generated_at: "2026-04-24T05:41:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a8cf9a4041b63e13feb21ee2eb22909cb14931d6929bedf6b94315f7a270cf
    source_path: channels/matrix-push-rules.md
    workflow: 15
---

Quando `channels.matrix.streaming` é `"quiet"`, o OpenClaw edita um único evento de pré-visualização no lugar e marca a edição finalizada com uma flag de conteúdo personalizada. Clientes Matrix notificam apenas na edição final se uma regra de push por usuário corresponder a essa flag. Esta página é para operadores que auto-hospedam Matrix e querem instalar essa regra para cada conta destinatária.

Se você quiser apenas o comportamento padrão de notificações do Matrix, use `streaming: "partial"` ou deixe o streaming desativado. Consulte [Configuração do canal Matrix](/pt-BR/channels/matrix#streaming-previews).

## Pré-requisitos

- usuário destinatário = a pessoa que deve receber a notificação
- usuário do bot = a conta Matrix do OpenClaw que envia a resposta
- use o token de acesso do usuário destinatário para as chamadas de API abaixo
- faça `sender` na regra de push corresponder ao MXID completo do usuário do bot
- a conta destinatária já deve ter pushers funcionando — regras de pré-visualização discreta só funcionam quando a entrega normal de push do Matrix está saudável

## Etapas

<Steps>
  <Step title="Configurar pré-visualizações discretas">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="Obter o token de acesso do destinatário">
    Reutilize um token de sessão de cliente existente sempre que possível. Para gerar um novo:

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="Verificar se existem pushers">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

Se nenhum pusher for retornado, corrija a entrega normal de push do Matrix para esta conta antes de continuar.

  </Step>

  <Step title="Instalar a regra de push de override">
    O OpenClaw marca edições finalizadas de pré-visualização somente de texto com `content["com.openclaw.finalized_preview"] = true`. Instale uma regra que corresponda a esse marcador mais o MXID do bot como remetente:

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    Substitua antes de executar:

    - `https://matrix.example.org`: URL base do seu homeserver
    - `$USER_ACCESS_TOKEN`: token de acesso do usuário destinatário
    - `openclaw-finalized-preview-botname`: um ID de regra exclusivo por bot por destinatário (padrão: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: o MXID do seu bot OpenClaw, não o do destinatário

  </Step>

  <Step title="Verificar">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Em seguida, teste uma resposta com streaming. No modo quiet, a sala mostra um rascunho de pré-visualização discreto e notifica uma vez quando o bloco ou turno termina.

  </Step>
</Steps>

Para remover a regra depois, use `DELETE` na mesma URL da regra com o token do destinatário.

## Observações sobre vários bots

As regras de push são indexadas por `ruleId`: executar `PUT` novamente no mesmo ID atualiza uma única regra. Para vários bots OpenClaw notificando o mesmo destinatário, crie uma regra por bot com uma correspondência de remetente distinta.

Novas regras `override` definidas pelo usuário são inseridas antes das regras padrão de supressão, então nenhum parâmetro extra de ordenação é necessário. A regra afeta apenas edições de pré-visualização somente de texto que podem ser finalizadas no lugar; fallbacks de mídia e fallbacks de pré-visualização obsoleta usam a entrega normal do Matrix.

## Observações sobre o homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Nenhuma alteração especial em `homeserver.yaml` é necessária. Se as notificações normais do Matrix já chegam a este usuário, o token do destinatário + a chamada `pushrules` acima são a principal etapa de configuração.

    Se você executa o Synapse atrás de um proxy reverso ou workers, garanta que `/_matrix/client/.../pushrules/` chegue corretamente ao Synapse. A entrega de push é tratada pelo processo principal ou por `synapse.app.pusher` / workers de pusher configurados — garanta que eles estejam saudáveis.

  </Accordion>

  <Accordion title="Tuwunel">
    Mesmo fluxo do Synapse; nenhuma configuração específica do Tuwunel é necessária para o marcador de pré-visualização finalizada.

    Se as notificações desaparecerem enquanto o usuário estiver ativo em outro dispositivo, verifique se `suppress_push_when_active` está habilitado. O Tuwunel adicionou essa opção na versão 1.4.2 (setembro de 2025), e ela pode suprimir intencionalmente push para outros dispositivos enquanto um dispositivo estiver ativo.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Configuração do canal Matrix](/pt-BR/channels/matrix)
- [Conceitos de streaming](/pt-BR/concepts/streaming)
