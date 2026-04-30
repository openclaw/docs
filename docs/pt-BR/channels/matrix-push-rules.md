---
read_when:
    - Configurando o streaming silencioso do Matrix para Synapse ou Tuwunel auto-hospedados
    - Os usuários querem notificações apenas quando os blocos forem concluídos, não a cada edição de pré-visualização
summary: Regras de notificação push do Matrix por destinatário para edições finalizadas silenciosas de pré-visualização
title: Regras de push do Matrix para pré-visualizações silenciosas
x-i18n:
    generated_at: "2026-04-30T09:36:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2f037a50a85b350163c74cf6b9cce335ecaaa5cccc762124122ad6d0321a1fa
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Quando `channels.matrix.streaming` é `"quiet"`, o OpenClaw edita um único evento de prévia no local e marca a edição finalizada com uma flag de conteúdo personalizada. Clientes Matrix notificam na edição final somente se uma regra de push por usuário corresponder a essa flag. Esta página é para operadores que hospedam o próprio Matrix e querem instalar essa regra para cada conta destinatária.

Se você quer apenas o comportamento padrão de notificação do Matrix, use `streaming: "partial"` ou deixe o streaming desativado. Consulte [Configuração do canal Matrix](/pt-BR/channels/matrix#streaming-previews).

## Pré-requisitos

- usuário destinatário = a pessoa que deve receber a notificação
- usuário bot = a conta Matrix do OpenClaw que envia a resposta
- use o token de acesso do usuário destinatário para as chamadas de API abaixo
- corresponda `sender` na regra de push ao MXID completo do usuário bot
- a conta destinatária já deve ter pushers funcionais — regras de prévia silenciosa só funcionam quando a entrega normal de push do Matrix está saudável

## Etapas

<Steps>
  <Step title="Configurar prévias silenciosas">

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
    Reutilize um token de sessão de cliente existente quando possível. Para gerar um novo:

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
    O OpenClaw marca edições finalizadas de prévias somente texto com `content["com.openclaw.finalized_preview"] = true`. Instale uma regra que corresponda a esse marcador e ao MXID do bot como remetente:

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

    - `https://matrix.example.org`: a URL base do seu homeserver
    - `$USER_ACCESS_TOKEN`: o token de acesso do usuário destinatário
    - `openclaw-finalized-preview-botname`: um ID de regra exclusivo por bot por destinatário (padrão: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: o MXID do seu bot OpenClaw, não o do destinatário

  </Step>

  <Step title="Verificar">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Depois, teste uma resposta transmitida. No modo silencioso, a sala mostra uma prévia de rascunho silenciosa e notifica uma vez quando o bloco ou turno termina.

  </Step>
</Steps>

Para remover a regra depois, use `DELETE` na mesma URL da regra com o token do destinatário.

## Observações sobre vários bots

Regras de push são indexadas por `ruleId`: executar `PUT` novamente contra o mesmo ID atualiza uma única regra. Para vários bots OpenClaw notificando o mesmo destinatário, crie uma regra por bot com uma correspondência de remetente distinta.

Novas regras `override` definidas pelo usuário são inseridas antes das regras padrão de supressão, portanto nenhum parâmetro extra de ordenação é necessário. A regra afeta apenas edições de prévia somente texto que podem ser finalizadas no local; fallbacks de mídia e fallbacks de prévia obsoleta usam a entrega normal do Matrix.

## Observações sobre homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Nenhuma alteração especial em `homeserver.yaml` é necessária. Se as notificações normais do Matrix já chegam a este usuário, o token do destinatário + a chamada `pushrules` acima é a principal etapa de configuração.

    Se você executa o Synapse atrás de um proxy reverso ou workers, garanta que `/_matrix/client/.../pushrules/` chegue corretamente ao Synapse. A entrega de push é tratada pelo processo principal ou por `synapse.app.pusher` / workers de pusher configurados — garanta que eles estejam saudáveis.

    A regra usa a condição de regra de push `event_property_is` (MSC3758, regra de push v1.10), que foi adicionada ao Synapse em 2023. Versões mais antigas do Synapse aceitam a chamada `PUT pushrules/...`, mas silenciosamente nunca correspondem à condição — atualize o Synapse se nenhuma notificação chegar em uma edição de prévia finalizada.

  </Accordion>

  <Accordion title="Tuwunel">
    Mesmo fluxo que o Synapse; nenhuma configuração específica do Tuwunel é necessária para o marcador de prévia finalizada.

    Se as notificações desaparecerem enquanto o usuário estiver ativo em outro dispositivo, verifique se `suppress_push_when_active` está ativado. O Tuwunel adicionou essa opção na versão 1.4.2 (setembro de 2025), e ela pode suprimir intencionalmente pushes para outros dispositivos enquanto um dispositivo está ativo.

  </Accordion>
</AccordionGroup>

## Relacionado

- [Configuração do canal Matrix](/pt-BR/channels/matrix)
- [Conceitos de streaming](/pt-BR/concepts/streaming)
