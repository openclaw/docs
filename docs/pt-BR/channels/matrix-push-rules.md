---
read_when:
    - Configurando o streaming silencioso do Matrix para Synapse ou Tuwunel auto-hospedado
    - Os usuários querem notificações apenas sobre blocos concluídos, não a cada edição da prévia
summary: Regras de push do Matrix por destinatário para edições silenciosas de pré-visualizações finalizadas
title: Regras de push do Matrix para prévias silenciosas
x-i18n:
    generated_at: "2026-07-16T12:11:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 1c58e7e796c3ae6d1ee25de229e4592ab8b4fb4d0d50a9cf868ab5ef35b1dab5
    source_path: channels/matrix-push-rules.md
    workflow: 16
---

Quando `channels.matrix.streaming.mode` é `"quiet"`, o OpenClaw transmite a resposta editando um único evento de prévia no próprio local. As prévias são enviadas como eventos `m.notice` sem notificação, e a edição finalizada é marcada com `content["com.openclaw.finalized_preview"] = true`. Os clientes Matrix notificam sobre essa edição final somente se uma regra de push por usuário corresponder ao marcador. Esta página é destinada a operadores que hospedam o Matrix por conta própria e desejam instalar essa regra para cada conta destinatária.

`streaming.mode: "progress"` finaliza seus rascunhos pelo mesmo caminho, portanto a mesma regra também é acionada para edições finalizadas no modo de progresso.

Se quiser apenas o comportamento padrão de notificações do Matrix, use `streaming.mode: "partial"` ou mantenha a transmissão desativada. Consulte [Configuração do canal Matrix](/pt-BR/channels/matrix#streaming-previews).

## Pré-requisitos

- usuário destinatário = a pessoa que deve receber a notificação
- usuário bot = a conta Matrix do OpenClaw que envia a resposta
- use o token de acesso do usuário destinatário nas chamadas de API abaixo
- faça `sender` corresponder ao MXID completo do usuário bot na regra de push
- a conta destinatária já deve ter pushers funcionando; as regras de prévia silenciosa só funcionam quando a entrega normal de push do Matrix está íntegra

## Etapas

<Steps>
  <Step title="Configurar prévias silenciosas">

```json5
{
  channels: {
    matrix: {
      streaming: { mode: "quiet" },
    },
  },
}
```

  </Step>

  <Step title="Obter o token de acesso do destinatário">
    Reutilize um token de sessão de cliente existente sempre que possível. Para emitir um novo:

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

Se nenhum pusher for retornado, corrija a entrega normal de push do Matrix para essa conta antes de continuar.

  </Step>

  <Step title="Instalar a regra de push de substituição">
    Instale uma regra que corresponda ao marcador de prévia finalizada e ao MXID do bot como remetente:

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
    - `openclaw-finalized-preview-botname`: um ID de regra exclusivo por bot e por destinatário (padrão: `openclaw-finalized-preview-<botname>`)
    - `@bot:example.org`: o MXID do seu bot OpenClaw, não o do destinatário

  </Step>

  <Step title="Verificar">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

Em seguida, teste uma resposta transmitida. No modo silencioso, a sala exibe uma prévia silenciosa do rascunho e notifica quando o bloco ou o turno termina.

  </Step>
</Steps>

Para remover a regra posteriormente, `DELETE` a mesma URL da regra com o token do destinatário.

## Observações sobre vários bots

As regras de push são identificadas por `ruleId`: executar `PUT` novamente com o mesmo ID atualiza uma única regra. Para que vários bots OpenClaw notifiquem o mesmo destinatário, crie uma regra por bot com uma correspondência de remetente distinta.

Novas regras `override` definidas pelo usuário são inseridas antes das regras de supressão padrão do servidor, portanto nenhum parâmetro adicional de ordenação é necessário. A regra afeta apenas edições de prévias exclusivamente de texto que podem ser finalizadas no próprio local; respostas com mídia, fallbacks de prévias obsoletas e textos finais que ativariam menções do Matrix são entregues como mensagens normais com notificação.

## Observações sobre o homeserver

<AccordionGroup>
  <Accordion title="Synapse">
    Nenhuma alteração especial em `homeserver.yaml` é necessária. Se as notificações normais do Matrix já chegam a esse usuário, o token do destinatário e a chamada `pushrules` acima constituem a principal etapa de configuração.

    Se o Synapse for executado por trás de um proxy reverso ou de workers, certifique-se de que `/_matrix/client/.../pushrules/` chegue corretamente ao Synapse. A entrega de push é processada pelo processo principal ou por `synapse.app.pusher` / workers de pusher configurados — certifique-se de que estejam íntegros.

    A regra usa a condição de regra de push `event_property_is` (MSC3758, regra de push v1.10), que foi adicionada ao Synapse em 2023. Versões mais antigas do Synapse aceitam a chamada `PUT pushrules/...`, mas silenciosamente nunca correspondem à condição — atualize o Synapse se nenhuma notificação chegar em uma edição de prévia finalizada.

  </Accordion>

  <Accordion title="Tuwunel">
    O fluxo é o mesmo do Synapse; nenhuma configuração específica do Tuwunel é necessária para o marcador de prévia finalizada.

    Se as notificações desaparecerem enquanto o usuário estiver ativo em outro dispositivo, verifique se `suppress_push_when_active` está habilitado. O Tuwunel adicionou essa opção na versão 1.4.2 (setembro de 2025), e ela pode suprimir intencionalmente os pushes para outros dispositivos enquanto um dispositivo estiver ativo.

  </Accordion>
</AccordionGroup>

## Relacionados

- [Configuração do canal Matrix](/pt-BR/channels/matrix)
- [Conceitos de transmissão](/pt-BR/concepts/streaming)
