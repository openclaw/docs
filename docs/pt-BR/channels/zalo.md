---
read_when:
    - Trabalhando em recursos ou Webhooks do Zalo
summary: Status de suporte do bot do Zalo, recursos e configuração
title: Zalo
x-i18n:
    generated_at: "2026-04-25T13:42:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: e7eb9d5b1879fcdf70220c4b1542e843e47e12048ff567eeb0e1cb3367b3d200
    source_path: channels/zalo.md
    workflow: 15
---

Status: experimental. Mensagens diretas são compatíveis. A seção [Recursos](#capabilities) abaixo reflete o comportamento atual dos bots do Marketplace.

## Plugin incluído

O Zalo é distribuído como Plugin incluído nas versões atuais do OpenClaw, portanto compilações empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma versão mais antiga ou em uma instalação personalizada que exclui o Zalo, instale-o manualmente:

- Instale via CLI: `openclaw plugins install @openclaw/zalo`
- Ou a partir de um checkout do código-fonte: `openclaw plugins install ./path/to/local/zalo-plugin`
- Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida (iniciante)

1. Verifique se o plugin do Zalo está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Defina o token:
   - Env: `ZALO_BOT_TOKEN=...`
   - Ou na configuração: `channels.zalo.accounts.default.botToken: "..."`.
3. Reinicie o Gateway (ou conclua a configuração).
4. O acesso por mensagem direta usa emparelhamento por padrão; aprove o código de emparelhamento no primeiro contato.

Configuração mínima:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

## O que é

Zalo é um aplicativo de mensagens focado no Vietnã; sua API de bot permite que o Gateway execute um bot para conversas 1:1.
É uma boa opção para suporte ou notificações quando você deseja roteamento determinístico de volta para o Zalo.

Esta página reflete o comportamento atual do OpenClaw para **bots do Zalo Bot Creator / Marketplace**.
**Bots do Zalo Official Account (OA)** pertencem a uma superfície de produto diferente do Zalo e podem se comportar de forma diferente.

- Um canal da API de bot do Zalo controlado pelo Gateway.
- Roteamento determinístico: as respostas retornam para o Zalo; o modelo nunca escolhe canais.
- Mensagens diretas compartilham a sessão principal do agente.
- A seção [Recursos](#capabilities) abaixo mostra o suporte atual para bots do Marketplace.

## Configuração (caminho rápido)

### 1) Criar um token de bot (Zalo Bot Platform)

1. Acesse [https://bot.zaloplatforms.com](https://bot.zaloplatforms.com) e faça login.
2. Crie um novo bot e configure suas definições.
3. Copie o token completo do bot (normalmente `numeric_id:secret`). Para bots do Marketplace, o token de runtime utilizável pode aparecer na mensagem de boas-vindas do bot após a criação.

### 2) Configurar o token (env ou configuração)

Exemplo:

```json5
{
  channels: {
    zalo: {
      enabled: true,
      accounts: {
        default: {
          botToken: "12345689:abc-xyz",
          dmPolicy: "pairing",
        },
      },
    },
  },
}
```

Se depois você migrar para uma superfície de bot do Zalo em que grupos estejam disponíveis, poderá adicionar explicitamente configurações específicas de grupo, como `groupPolicy` e `groupAllowFrom`. Para o comportamento atual de bots do Marketplace, consulte [Recursos](#capabilities).

Opção por variável de ambiente: `ZALO_BOT_TOKEN=...` (funciona apenas para a conta padrão).

Suporte a múltiplas contas: use `channels.zalo.accounts` com tokens por conta e `name` opcional.

3. Reinicie o Gateway. O Zalo é iniciado quando um token é resolvido (env ou configuração).
4. O acesso por mensagem direta usa emparelhamento por padrão. Aprove o código quando o bot for contatado pela primeira vez.

## Como funciona (comportamento)

- As mensagens recebidas são normalizadas no envelope compartilhado do canal com placeholders de mídia.
- As respostas sempre são roteadas de volta para o mesmo chat do Zalo.
- Long-polling por padrão; modo Webhook disponível com `channels.zalo.webhookUrl`.

## Limites

- O texto de saída é dividido em blocos de 2000 caracteres (limite da API do Zalo).
- Downloads/uploads de mídia são limitados por `channels.zalo.mediaMaxMb` (padrão 5).
- O streaming é bloqueado por padrão devido ao limite de 2000 caracteres, que o torna menos útil.

## Controle de acesso (mensagens diretas)

### Acesso por mensagem direta

- Padrão: `channels.zalo.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de emparelhamento; as mensagens são ignoradas até a aprovação (os códigos expiram após 1 hora).
- Aprove via:
  - `openclaw pairing list zalo`
  - `openclaw pairing approve zalo <CODE>`
- O emparelhamento é a troca de token padrão. Detalhes: [Emparelhamento](/pt-BR/channels/pairing)
- `channels.zalo.allowFrom` aceita IDs numéricos de usuário (não há busca por nome de usuário disponível).

## Controle de acesso (Grupos)

Para **bots do Zalo Bot Creator / Marketplace**, o suporte a grupos não estava disponível na prática porque o bot não podia ser adicionado a um grupo.

Isso significa que as chaves de configuração relacionadas a grupos abaixo existem no schema, mas não eram utilizáveis para bots do Marketplace:

- `channels.zalo.groupPolicy` controla o tratamento de entrada de grupos: `open | allowlist | disabled`.
- `channels.zalo.groupAllowFrom` restringe quais IDs de remetente podem acionar o bot em grupos.
- Se `groupAllowFrom` não estiver definido, o Zalo usa `allowFrom` como fallback para verificações de remetente.
- Observação de runtime: se `channels.zalo` estiver totalmente ausente, o runtime ainda usa `groupPolicy="allowlist"` como fallback por segurança.

Os valores de política de grupo (quando o acesso a grupos estiver disponível na superfície do seu bot) são:

- `groupPolicy: "disabled"` — bloqueia todas as mensagens de grupo.
- `groupPolicy: "open"` — permite qualquer membro do grupo (controlado por menção).
- `groupPolicy: "allowlist"` — padrão fail-closed; apenas remetentes permitidos são aceitos.

Se você estiver usando uma superfície de produto de bot do Zalo diferente e tiver verificado um comportamento de grupo funcional, documente isso separadamente em vez de presumir que corresponde ao fluxo do bot do Marketplace.

## Long-polling vs Webhook

- Padrão: long-polling (nenhuma URL pública necessária).
- Modo Webhook: defina `channels.zalo.webhookUrl` e `channels.zalo.webhookSecret`.
  - O segredo do Webhook deve ter de 8 a 256 caracteres.
  - A URL do Webhook deve usar HTTPS.
  - O Zalo envia eventos com o cabeçalho `X-Bot-Api-Secret-Token` para verificação.
  - O HTTP do Gateway trata requisições de Webhook em `channels.zalo.webhookPath` (por padrão, o caminho da URL do Webhook).
  - As requisições devem usar `Content-Type: application/json` (ou tipos de mídia `+json`).
  - Eventos duplicados (`event_name + message_id`) são ignorados por uma janela curta de repetição.
  - Tráfego em rajada é limitado por taxa por caminho/origem e pode retornar HTTP 429.

**Observação:** `getUpdates` (polling) e Webhook são mutuamente exclusivos de acordo com a documentação da API do Zalo.

## Tipos de mensagem compatíveis

Para um panorama rápido do suporte, consulte [Recursos](#capabilities). As observações abaixo adicionam detalhes onde o comportamento precisa de contexto extra.

- **Mensagens de texto**: suporte completo com divisão em blocos de 2000 caracteres.
- **URLs simples no texto**: comportam-se como entrada de texto normal.
- **Pré-visualizações de link / cartões de link avançados**: consulte o status do bot do Marketplace em [Recursos](#capabilities); eles não acionavam uma resposta de forma confiável.
- **Mensagens com imagem**: consulte o status do bot do Marketplace em [Recursos](#capabilities); o tratamento de imagens recebidas não era confiável (indicador de digitação sem resposta final).
- **Figurinhas**: consulte o status do bot do Marketplace em [Recursos](#capabilities).
- **Notas de voz / arquivos de áudio / vídeo / anexos de arquivo genéricos**: consulte o status do bot do Marketplace em [Recursos](#capabilities).
- **Tipos não compatíveis**: registrados em log (por exemplo, mensagens de usuários protegidos).

## Recursos

Esta tabela resume o comportamento atual do **bot do Zalo Bot Creator / Marketplace** no OpenClaw.

| Recurso                     | Status                                  |
| --------------------------- | --------------------------------------- |
| Mensagens diretas           | ✅ Compatível                           |
| Grupos                      | ❌ Não disponível para bots do Marketplace |
| Mídia (imagens recebidas)   | ⚠️ Limitado / verifique no seu ambiente |
| Mídia (imagens de saída)    | ⚠️ Não retestado para bots do Marketplace |
| URLs simples no texto       | ✅ Compatível                           |
| Pré-visualizações de link   | ⚠️ Não confiável para bots do Marketplace |
| Reações                     | ❌ Não compatível                       |
| Figurinhas                  | ⚠️ Sem resposta do agente para bots do Marketplace |
| Notas de voz / áudio / vídeo | ⚠️ Sem resposta do agente para bots do Marketplace |
| Anexos de arquivo           | ⚠️ Sem resposta do agente para bots do Marketplace |
| Threads                     | ❌ Não compatível                       |
| Enquetes                    | ❌ Não compatível                       |
| Comandos nativos            | ❌ Não compatível                       |
| Streaming                   | ⚠️ Bloqueado (limite de 2000 caracteres) |

## Destinos de entrega (CLI/Cron)

- Use um ID de chat como destino.
- Exemplo: `openclaw message send --channel zalo --target 123456789 --message "hi"`.

## Solução de problemas

**O bot não responde:**

- Verifique se o token é válido: `openclaw channels status --probe`
- Verifique se o remetente está aprovado (pairing ou allowFrom)
- Verifique os logs do Gateway: `openclaw logs --follow`

**O Webhook não está recebendo eventos:**

- Verifique se a URL do Webhook usa HTTPS
- Verifique se o token secreto tem de 8 a 256 caracteres
- Confirme se o endpoint HTTP do Gateway está acessível no caminho configurado
- Verifique se o polling `getUpdates` não está em execução (eles são mutuamente exclusivos)

## Referência de configuração (Zalo)

Configuração completa: [Configuration](/pt-BR/gateway/configuration)

As chaves planas de nível superior (`channels.zalo.botToken`, `channels.zalo.dmPolicy` e semelhantes) são uma forma abreviada legada de conta única. Prefira `channels.zalo.accounts.<id>.*` para novas configurações. Ambas as formas ainda são documentadas aqui porque existem no schema.

Opções do provedor:

- `channels.zalo.enabled`: habilitar/desabilitar a inicialização do canal.
- `channels.zalo.botToken`: token do bot da Zalo Bot Platform.
- `channels.zalo.tokenFile`: ler token de um caminho de arquivo regular. Symlinks são rejeitados.
- `channels.zalo.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing).
- `channels.zalo.allowFrom`: allowlist de mensagens diretas (IDs de usuário). `open` exige `"*"`. O assistente pedirá IDs numéricos.
- `channels.zalo.groupPolicy`: `open | allowlist | disabled` (padrão: allowlist). Presente na configuração; consulte [Recursos](#capabilities) e [Controle de acesso (Grupos)](#access-control-groups) para o comportamento atual de bots do Marketplace.
- `channels.zalo.groupAllowFrom`: allowlist de remetentes de grupo (IDs de usuário). Usa `allowFrom` como fallback quando não definido.
- `channels.zalo.mediaMaxMb`: limite de mídia de entrada/saída (MB, padrão 5).
- `channels.zalo.webhookUrl`: habilita o modo Webhook (HTTPS obrigatório).
- `channels.zalo.webhookSecret`: segredo do Webhook (8-256 caracteres).
- `channels.zalo.webhookPath`: caminho do Webhook no servidor HTTP do Gateway.
- `channels.zalo.proxy`: URL de proxy para requisições de API.

Opções de múltiplas contas:

- `channels.zalo.accounts.<id>.botToken`: token por conta.
- `channels.zalo.accounts.<id>.tokenFile`: arquivo de token regular por conta. Symlinks são rejeitados.
- `channels.zalo.accounts.<id>.name`: nome de exibição.
- `channels.zalo.accounts.<id>.enabled`: habilitar/desabilitar conta.
- `channels.zalo.accounts.<id>.dmPolicy`: política de mensagens diretas por conta.
- `channels.zalo.accounts.<id>.allowFrom`: allowlist por conta.
- `channels.zalo.accounts.<id>.groupPolicy`: política de grupo por conta. Presente na configuração; consulte [Recursos](#capabilities) e [Controle de acesso (Grupos)](#access-control-groups) para o comportamento atual de bots do Marketplace.
- `channels.zalo.accounts.<id>.groupAllowFrom`: allowlist de remetentes de grupo por conta.
- `channels.zalo.accounts.<id>.webhookUrl`: URL do Webhook por conta.
- `channels.zalo.accounts.<id>.webhookSecret`: segredo do Webhook por conta.
- `channels.zalo.accounts.<id>.webhookPath`: caminho do Webhook por conta.
- `channels.zalo.accounts.<id>.proxy`: URL de proxy por conta.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Emparelhamento](/pt-BR/channels/pairing) — autenticação por mensagem direta e fluxo de emparelhamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
