---
read_when:
    - Você usava o antigo canal BlueBubbles e precisa migrar para o iMessage
    - Você está escolhendo a configuração compatível do iMessage no OpenClaw
    - Você precisa de uma breve explicação sobre a remoção do BlueBubbles
summary: O suporte ao BlueBubbles foi removido do OpenClaw. Use o plugin integrado do iMessage com imsg para configurações novas e migradas do iMessage.
title: Remoção do BlueBubbles e o caminho do iMessage via imsg
x-i18n:
    generated_at: "2026-07-11T23:42:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7dec7d3f27e0df6431494d864b0c7ae7457574797e199f9a2cb6931d28feacd0
    source_path: announcements/bluebubbles-imessage.md
    workflow: 16
---

# Remoção do BlueBubbles e o caminho do iMessage via imsg

O OpenClaw não inclui mais o canal BlueBubbles. O suporte ao iMessage funciona por meio do plugin `imessage` incluído: o Gateway inicia o [`imsg`](https://github.com/steipete/imsg) como um processo filho, localmente ou por meio de um wrapper SSH, e se comunica via JSON-RPC pela entrada/saída padrão. Sem servidor, sem webhook, sem porta.

Se a sua configuração ainda contiver `channels.bluebubbles`, migre-a para `channels.imessage`. A URL legada da documentação `/channels/bluebubbles` redireciona para [Migração do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles), que contém a tabela completa de conversão da configuração e a lista de verificação para a transição.

## O que mudou

- O caminho compatível com o iMessage não tem servidor HTTP do BlueBubbles, rota de webhook, senha REST nem ambiente de execução do plugin BlueBubbles.
- O OpenClaw lê e monitora o Mensagens por meio do `imsg` no Mac em que há uma sessão iniciada no Messages.app.
- O envio, o recebimento, o histórico e as mídias básicos usam as interfaces normais do `imsg` e as permissões do macOS.
- Ações avançadas (respostas em threads, reações, edição, cancelamento de envio, efeitos, confirmações de leitura, indicadores de digitação e gerenciamento de grupos) exigem a ponte de API privada: execute `imsg launch`, o que requer que o SIP esteja desativado.
- Gateways Linux e Windows ainda podem usar o iMessage apontando `channels.imessage.cliPath` para um wrapper SSH que execute o `imsg` no Mac com a sessão iniciada.

## O que fazer

1. Instale e verifique o `imsg` no Mac que executa o Mensagens:

   ```bash
   brew install steipete/tap/imsg
   imsg --version
   imsg chats --limit 3
   imsg rpc --help
   ```

2. Conceda permissões de Acesso Total ao Disco e Automação ao contexto de processo que executa o `imsg` e o OpenClaw.

3. Converta a configuração antiga:

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

5. Teste mensagens diretas, grupos, anexos e todas as ações da API privada das quais você depende antes de excluir o servidor BlueBubbles antigo.

## Observações sobre a migração

- `channels.bluebubbles.serverUrl` e `channels.bluebubbles.password` não têm equivalente no iMessage; não há servidor para acessar ou no qual se autenticar.
- `allowFrom`, `groupAllowFrom`, `groups`, `includeAttachments`, `attachmentRoots`, `mediaMaxMb`, `textChunkLimit` e `actions.*` mantêm seus significados em `channels.imessage`.
- `channels.imessage.includeAttachments` continua desativado por padrão. Defina-o explicitamente se quiser que fotos, memorandos de voz, vídeos ou arquivos recebidos cheguem ao agente.
- Com `groupPolicy: "allowlist"`, copie o bloco `groups` antigo, incluindo qualquer entrada curinga `"*"`. As listas de remetentes permitidos de grupos e o registro de grupos são verificações separadas; um bloco `groups` com entradas, mas sem um `chat_id` correspondente (ou sem `"*"`) descarta a mensagem durante a execução, e um bloco `groups` vazio registra um aviso na inicialização, embora a filtragem de remetentes ainda permita a passagem das mensagens.
- As vinculações ACP com `match.channel: "bluebubbles"` devem ser alteradas para `"imessage"`.
- As chaves de sessão antigas do BlueBubbles não se tornam chaves de sessão do iMessage. As aprovações de pareamento usam os identificadores dos remetentes como chave; portanto, as entradas `allowFrom` copiadas continuam funcionando, mas o histórico de conversas associado às chaves de sessão do BlueBubbles não é transferido.

## Veja também

- [Migração do BlueBubbles](/pt-BR/channels/imessage-from-bluebubbles)
- [iMessage](/pt-BR/channels/imessage)
- [Referência de configuração — iMessage](/pt-BR/gateway/config-channels#imessage)
