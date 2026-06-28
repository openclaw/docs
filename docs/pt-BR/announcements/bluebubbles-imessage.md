---
read_when:
    - Você usou o canal antigo do BlueBubbles e precisa migrar para o iMessage
    - Você está escolhendo a configuração de iMessage com suporte no OpenClaw
    - Você precisa de uma breve explicação sobre a remoção do BlueBubbles
summary: O suporte ao BlueBubbles foi removido do OpenClaw. Use o Plugin iMessage incluído com imsg para configurações novas e migradas do iMessage.
title: Remoção do BlueBubbles e o caminho imsg do iMessage
x-i18n:
    generated_at: "2026-05-11T20:20:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 970e33772534fd3e3d8d3012222bdd9c645ed713b8d38cff21b25b276ae1f544
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Remoção do BlueBubbles e o caminho iMessage do imsg

O OpenClaw não distribui mais o canal BlueBubbles. O suporte a iMessage agora funciona por meio do Plugin `imessage` incluído, que inicia o [`imsg`](https://github.com/steipete/imsg) localmente ou por meio de um wrapper SSH e conversa via JSON-RPC por stdin/stdout.

Se sua configuração ainda contém `channels.bluebubbles`, migre-a para `channels.imessage`. A URL legada da documentação `/channels/bluebubbles` redireciona para [Vindo do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles), que tem a tabela completa de tradução de configuração e a lista de verificação de transição.

## O que mudou

- Não há servidor HTTP BlueBubbles, rota de Webhook, senha REST nem runtime do Plugin BlueBubbles no caminho iMessage com suporte do OpenClaw.
- O OpenClaw lê e monitora Mensagens por meio do `imsg` no Mac em que o Messages.app está autenticado.
- Envio, recebimento, histórico e mídia básicos usam as superfícies normais do `imsg` e permissões do macOS.
- Ações avançadas, como respostas em thread, tapbacks, edição, desfazer envio, efeitos, confirmações de leitura, indicadores de digitação e gerenciamento de grupos, exigem `imsg launch` com a ponte de API privada disponível.
- Gateways Linux e Windows ainda podem usar iMessage definindo `channels.imessage.cliPath` como um wrapper SSH que executa `imsg` no Mac autenticado.

## O que fazer

1. Instale e verifique o `imsg` no Mac do Mensagens:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Conceda permissões de Acesso Total ao Disco e Automação ao contexto de processo que executa `imsg` e OpenClaw.

3. Traduza a configuração antiga:

   ```json5
   {
     channels: {
       imessage: {
         enabled: true,
         cliPath: "/opt/homebrew/bin/imsg",
         dmPolicy: "pairing",
         allowFrom: ["+15555550123"],
         groupPolicy: "allowlist",
         groupAllowFrom: ["+15555550123"],
         groups: {
           "*": { requireMention: true },
         },
         includeAttachments: true,
       },
     },
   }
   ```

4. Reinicie o Gateway e verifique:

   ```bash
   openclaw channels status --probe
   ```

5. Teste DMs, grupos, anexos e quaisquer ações de API privada das quais você depende antes de excluir seu servidor BlueBubbles antigo.

## Observações de migração

- `channels.bluebubbles.serverUrl` e `channels.bluebubbles.password` não têm equivalente em iMessage.
- `channels.bluebubbles.allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, raízes de anexos, limites de tamanho de mídia, fragmentação e alternâncias de ações têm equivalentes em iMessage.
- `channels.imessage.includeAttachments` ainda fica desativado por padrão. Defina-o explicitamente se você espera que fotos, memorandos de voz, vídeos ou arquivos recebidos cheguem ao agente.
- Com `groupPolicy: "allowlist"`, copie o bloco `groups` antigo, incluindo qualquer entrada curinga `"*"`. Listas de permissão de remetentes de grupo e o registro de grupos são bloqueios separados.
- Vinculações ACP que correspondiam a `channel: "bluebubbles"` devem ser alteradas para `channel: "imessage"`.
- Chaves de sessão antigas do BlueBubbles não se tornam chaves de sessão do iMessage. Aprovações de pareamento são transferidas por identificador, mas o histórico de conversas em chaves de sessão do BlueBubbles não.

## Veja também

- [Vindo do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles)
- [iMessage](/pt-BR/channels/imessage)
- [Referência de configuração - iMessage](/pt-BR/gateway/config-channels#imessage)
