---
read_when:
    - Trabalhando nos recursos do canal Nextcloud Talk
summary: Status do suporte, recursos e configuração do Nextcloud Talk
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-07-12T14:54:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 234981d21df12eafabfef60822f2a145d37257689511efc6104451a735346d09
    source_path: channels/nextcloud-talk.md
    workflow: 16
---

Nextcloud Talk é um plugin de canal disponível para download (`@openclaw/nextcloud-talk`) que conecta o OpenClaw a uma instância auto-hospedada do Nextcloud por meio de um bot de Webhook do Talk. Há suporte a mensagens diretas, salas, reações e mensagens em markdown; mídias são enviadas como URLs.

## Instalação

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Use a especificação simples do pacote para acompanhar a tag da versão oficial atual. Fixe uma versão exata somente quando precisar de uma instalação reproduzível.

A partir de um checkout local (fluxos de desenvolvimento):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Reinicie o Gateway após a instalação. Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida (iniciante)

1. Instale o plugin (acima).
2. No servidor Nextcloud, crie um bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature webhook --feature response --feature reaction
   ```

   Mantenha `--feature response`: sem esse recurso, as respostas de saída falham com 401. Corrija um bot existente com `./occ talk:bot:state --feature webhook --feature response --feature reaction <botId> 1`.

3. Ative o bot nas configurações da sala de destino.
4. Configure o OpenClaw:
   - Configuração: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou variável de ambiente: `NEXTCLOUD_TALK_BOT_SECRET` (somente para a conta padrão)

   Configuração pela CLI (`--url`/`--token` são aliases dos campos explícitos; `nc-talk` e `nc` funcionam como aliases de canal):

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --url https://cloud.example.com \
     --token "<shared-secret>"
   ```

   Campos explícitos equivalentes:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret "<shared-secret>"
   ```

   Segredo armazenado em arquivo:

   ```bash
   openclaw channels add --channel nextcloud-talk \
     --base-url https://cloud.example.com \
     --secret-file /path/to/nextcloud-talk-secret
   ```

5. Reinicie o Gateway (ou conclua a configuração).

Configuração mínima:

```json5
{
  channels: {
    "nextcloud-talk": {
      enabled: true,
      baseUrl: "https://cloud.example.com",
      botSecret: "shared-secret",
      dmPolicy: "pairing",
    },
  },
}
```

## Observações

- Os bots não podem iniciar mensagens diretas. O usuário deve enviar uma mensagem ao bot primeiro.
- A URL do Webhook deve ser acessível pelo servidor Nextcloud; defina `webhookPublicUrl` quando o Gateway estiver atrás de um proxy. As solicitações de Webhook são assinadas com HMAC-SHA256 usando o segredo do bot; assinaturas inválidas são rejeitadas e ficam sujeitas a limitação de taxa.
- A API do bot não oferece suporte ao upload de mídias; a mídia de saída é anexada como uma linha `Attachment: <url>`.
- A carga útil do Webhook não diferencia mensagens diretas de salas; defina `apiUser` + `apiPassword` para ativar consultas de tipo de sala (armazenadas em cache por cerca de 5 minutos). Sem esses valores, toda conversa é tratada como uma sala.
- As solicitações de saída passam pela proteção contra SSRF. Para um host Nextcloud em uma rede privada/interna confiável, habilite explicitamente `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork: true`.
- Com `apiUser`/`apiPassword` e `webhookPublicUrl` definidos, `openclaw channels status` verifica o bot e avisa quando o recurso `response` está ausente.

## Controle de acesso (mensagens diretas)

- Padrão: `channels.nextcloud-talk.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento.
- Aprove por meio de:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- Mensagens diretas públicas: `channels.nextcloud-talk.dmPolicy="open"` junto com `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corresponde somente a IDs de usuários do Nextcloud (convertidos para minúsculas); nomes de exibição são ignorados.

## Salas (grupos)

- Padrão: `channels.nextcloud-talk.groupPolicy = "allowlist"` (exige menção).
- Inclua salas na lista de permissões com `channels.nextcloud-talk.rooms`, usando o token da sala como chave; `"*"` define um padrão curinga:

```json5
{
  channels: {
    "nextcloud-talk": {
      rooms: {
        "room-token": { requireMention: true },
      },
    },
  },
}
```

- Chaves por sala: `requireMention` (padrão: true), `enabled` (false desativa a sala), `allowFrom` (lista de remetentes permitidos por sala), `tools` (substituições de permissão/negação de ferramentas), `skills` (limita as Skills carregadas), `systemPrompt`.
- Para não permitir nenhuma sala, mantenha a lista de permissões vazia ou defina `channels.nextcloud-talk.groupPolicy="disabled"`.

## Recursos

| Recurso          | Status          |
| ---------------- | --------------- |
| Mensagens diretas | Compatível      |
| Salas             | Compatível      |
| Threads           | Não compatível  |
| Mídia             | Somente por URL |
| Reações           | Compatível      |
| Comandos nativos  | Não compatível  |

## Referência de configuração (Nextcloud Talk)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.nextcloud-talk.enabled`: ativa/desativa a inicialização do canal.
- `channels.nextcloud-talk.baseUrl`: URL da instância do Nextcloud.
- `channels.nextcloud-talk.botSecret`: segredo compartilhado do bot (string ou referência a segredo).
- `channels.nextcloud-talk.botSecretFile`: caminho do arquivo comum que contém o segredo. Links simbólicos são rejeitados.
- `channels.nextcloud-talk.apiUser`: usuário da API para consultas de sala (detecção de mensagens diretas) e verificação de status.
- `channels.nextcloud-talk.apiPassword`: senha da API/do aplicativo para consultas de sala.
- `channels.nextcloud-talk.apiPasswordFile`: caminho do arquivo da senha da API.
- `channels.nextcloud-talk.webhookPort`: porta do listener de Webhook (padrão: 8788).
- `channels.nextcloud-talk.webhookHost`: host do Webhook (padrão: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: caminho do Webhook (padrão: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL do Webhook acessível externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled` (padrão: pairing). `open` exige `allowFrom=["*"]`.
- `channels.nextcloud-talk.allowFrom`: lista de permissões para mensagens diretas (IDs de usuários).
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled` (padrão: allowlist).
- `channels.nextcloud-talk.groupAllowFrom`: lista de remetentes permitidos em salas (IDs de usuários); usa `allowFrom` como alternativa quando não está definida.
- `channels.nextcloud-talk.rooms`: configurações e lista de permissões por sala (veja acima).
- Grupos estáticos de acesso de remetentes podem ser referenciados em `allowFrom` e `groupAllowFrom` com `accessGroup:<name>`.
- `channels.nextcloud-talk.historyLimit`: limite do histórico de grupos (0 desativa).
- `channels.nextcloud-talk.dmHistoryLimit`: limite do histórico de mensagens diretas (0 desativa).
- `channels.nextcloud-talk.dms`: substituições por mensagem direta, indexadas pelo ID do usuário (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: tamanho dos blocos de texto de saída em caracteres (padrão: 4000).
- `channels.nextcloud-talk.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafos) antes da divisão por tamanho.
- `channels.nextcloud-talk.blockStreaming`: desativa o streaming em blocos para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste da agregação do streaming em blocos.
- `channels.nextcloud-talk.responsePrefix`: prefixo das respostas de saída.
- `channels.nextcloud-talk.markdown.tables`: modo de renderização de tabelas em markdown (`off | bullets | code | block`).
- `channels.nextcloud-talk.mediaMaxMb`: limite de mídia de entrada (MB).
- `channels.nextcloud-talk.network.dangerouslyAllowPrivateNetwork`: permite que hosts Nextcloud privados/internos passem pela proteção contra SSRF.
- `channels.nextcloud-talk.accounts.<id>`: substituições por conta (mesmas chaves); `defaultAccount` seleciona a conta padrão. As variáveis de ambiente `NEXTCLOUD_TALK_BOT_SECRET` / `NEXTCLOUD_TALK_API_PASSWORD` se aplicam somente à conta padrão.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e exigência de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção adicional
