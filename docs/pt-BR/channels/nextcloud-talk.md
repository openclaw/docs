---
read_when:
    - Trabalhar em recursos do canal Nextcloud Talk
summary: Status do suporte ao Nextcloud Talk, recursos e configuração
title: Nextcloud Talk
x-i18n:
    generated_at: "2026-04-24T05:42:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2eebd6cfd013d3a6e1cf03e2a2167d0657e688c5989f179bb0fec39f866586cb
    source_path: channels/nextcloud-talk.md
    workflow: 15
---

Status: Plugin empacotado (bot de Webhook). Mensagens diretas, salas, reações e mensagens em Markdown são compatíveis.

## Plugin empacotado

O Nextcloud Talk é fornecido como um Plugin empacotado nas versões atuais do OpenClaw, então compilações empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação antiga ou em uma instalação personalizada que exclui o Nextcloud Talk, instale-o manualmente:

Instalar via CLI (registro npm):

```bash
openclaw plugins install @openclaw/nextcloud-talk
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/nextcloud-talk-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida (iniciante)

1. Verifique se o Plugin do Nextcloud Talk está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. No seu servidor Nextcloud, crie um bot:

   ```bash
   ./occ talk:bot:install "OpenClaw" "<shared-secret>" "<webhook-url>" --feature reaction
   ```

3. Ative o bot nas configurações da sala de destino.
4. Configure o OpenClaw:
   - Configuração: `channels.nextcloud-talk.baseUrl` + `channels.nextcloud-talk.botSecret`
   - Ou env: `NEXTCLOUD_TALK_BOT_SECRET` (apenas conta padrão)
5. Reinicie o gateway (ou conclua a configuração).

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

- Bots não podem iniciar DMs. O usuário deve enviar uma mensagem ao bot primeiro.
- A URL do Webhook precisa ser acessível pelo Gateway; defina `webhookPublicUrl` se estiver atrás de um proxy.
- Uploads de mídia não são compatíveis com a API do bot; a mídia é enviada como URLs.
- O payload do Webhook não distingue DMs de salas; defina `apiUser` + `apiPassword` para ativar consultas de tipo de sala (caso contrário, DMs serão tratadas como salas).

## Controle de acesso (DMs)

- Padrão: `channels.nextcloud-talk.dmPolicy = "pairing"`. Remetentes desconhecidos recebem um código de pareamento.
- Aprove via:
  - `openclaw pairing list nextcloud-talk`
  - `openclaw pairing approve nextcloud-talk <CODE>`
- DMs públicas: `channels.nextcloud-talk.dmPolicy="open"` mais `channels.nextcloud-talk.allowFrom=["*"]`.
- `allowFrom` corresponde apenas a IDs de usuário do Nextcloud; nomes de exibição são ignorados.

## Salas (grupos)

- Padrão: `channels.nextcloud-talk.groupPolicy = "allowlist"` (com bloqueio por menção).
- Coloque salas na allowlist com `channels.nextcloud-talk.rooms`:

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

- Para não permitir nenhuma sala, mantenha a allowlist vazia ou defina `channels.nextcloud-talk.groupPolicy="disabled"`.

## Recursos

| Recurso          | Status           |
| ---------------- | ---------------- |
| Mensagens diretas | Compatível      |
| Salas            | Compatível       |
| Threads          | Não compatível   |
| Mídia            | Somente URL      |
| Reações          | Compatível       |
| Comandos nativos | Não compatível   |

## Referência de configuração (Nextcloud Talk)

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.nextcloud-talk.enabled`: ativa/desativa a inicialização do canal.
- `channels.nextcloud-talk.baseUrl`: URL da instância do Nextcloud.
- `channels.nextcloud-talk.botSecret`: segredo compartilhado do bot.
- `channels.nextcloud-talk.botSecretFile`: caminho para arquivo regular do segredo. Links simbólicos são rejeitados.
- `channels.nextcloud-talk.apiUser`: usuário da API para consultas de sala (detecção de DM).
- `channels.nextcloud-talk.apiPassword`: senha da API/aplicativo para consultas de sala.
- `channels.nextcloud-talk.apiPasswordFile`: caminho do arquivo de senha da API.
- `channels.nextcloud-talk.webhookPort`: porta do listener de Webhook (padrão: 8788).
- `channels.nextcloud-talk.webhookHost`: host do Webhook (padrão: 0.0.0.0).
- `channels.nextcloud-talk.webhookPath`: caminho do Webhook (padrão: /nextcloud-talk-webhook).
- `channels.nextcloud-talk.webhookPublicUrl`: URL de Webhook acessível externamente.
- `channels.nextcloud-talk.dmPolicy`: `pairing | allowlist | open | disabled`.
- `channels.nextcloud-talk.allowFrom`: allowlist de DM (IDs de usuário). `open` exige `"*"`.
- `channels.nextcloud-talk.groupPolicy`: `allowlist | open | disabled`.
- `channels.nextcloud-talk.groupAllowFrom`: allowlist de grupo (IDs de usuário).
- `channels.nextcloud-talk.rooms`: configurações por sala e allowlist.
- `channels.nextcloud-talk.historyLimit`: limite de histórico de grupo (0 desativa).
- `channels.nextcloud-talk.dmHistoryLimit`: limite de histórico de DM (0 desativa).
- `channels.nextcloud-talk.dms`: substituições por DM (`historyLimit`).
- `channels.nextcloud-talk.textChunkLimit`: tamanho do fragmento de texto de saída (caracteres).
- `channels.nextcloud-talk.chunkMode`: `length` (padrão) ou `newline` para dividir em linhas em branco (limites de parágrafo) antes da fragmentação por tamanho.
- `channels.nextcloud-talk.blockStreaming`: desativa block streaming para este canal.
- `channels.nextcloud-talk.blockStreamingCoalesce`: ajuste de consolidação de block streaming.
- `channels.nextcloud-talk.mediaMaxMb`: limite de mídia de entrada (MB).

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
