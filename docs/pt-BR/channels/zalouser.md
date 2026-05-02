---
read_when:
    - Configurando o Zalo Personal para o OpenClaw
    - Depuração do fluxo de login ou de mensagens do Zalo Personal
summary: Compatibilidade com conta pessoal do Zalo via zca-js nativo (login por QR), recursos e configuração
title: Zalo pessoal
x-i18n:
    generated_at: "2026-05-02T22:17:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0096775e0017e504130f2e19e05ab8114eadb873a9e11f79ea8f0dd91297567f
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimental. Esta integração automatiza uma **conta pessoal do Zalo** via `zca-js` nativo dentro do OpenClaw.

<Warning>
Esta é uma integração não oficial e pode resultar em suspensão ou banimento da conta. Use por sua conta e risco.
</Warning>

## Plugin incluído

O Zalo Personal é distribuído como um Plugin incluído nas versões atuais do OpenClaw, portanto builds
empacotados normais não precisam de uma instalação separada.

Se você estiver em um build mais antigo ou em uma instalação personalizada que exclui o Zalo Personal,
instale o pacote npm diretamente:

- Instale via CLI: `openclaw plugins install @openclaw/zalouser`
- Versão fixada: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Ou a partir de um checkout do código-fonte: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalhes: [Plugins](/pt-BR/tools/plugin)

Nenhum binário externo da CLI `zca`/`openzca` é necessário.

## Configuração rápida (iniciante)

1. Garanta que o Plugin Zalo Personal esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Faça login (QR, na máquina do Gateway):
   - `openclaw channels login --channel zalouser`
   - Escaneie o código QR com o aplicativo móvel do Zalo.
3. Habilite o canal:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing",
    },
  },
}
```

4. Reinicie o Gateway (ou conclua a configuração).
5. O acesso por DM usa pareamento por padrão; aprove o código de pareamento no primeiro contato.

## O que é

- Executa inteiramente em processo via `zca-js`.
- Usa listeners de eventos nativos para receber mensagens de entrada.
- Envia respostas diretamente pela API JS (texto/mídia/link).
- Projetado para casos de uso de “conta pessoal” nos quais a API do Zalo Bot não está disponível.

## Nomenclatura

O id do canal é `zalouser` para deixar explícito que isto automatiza uma **conta de usuário pessoal do Zalo** (não oficial). Mantemos `zalo` reservado para uma possível integração oficial futura com a API do Zalo.

## Encontrar IDs (diretório)

Use a CLI de diretório para descobrir pares/grupos e seus IDs:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- O texto de saída é dividido em partes de ~2000 caracteres (limites do cliente Zalo).
- Streaming é bloqueado por padrão.

## Controle de acesso (DMs)

`channels.zalouser.dmPolicy` aceita: `pairing | allowlist | open | disabled` (padrão: `pairing`).

`channels.zalouser.allowFrom` aceita IDs ou nomes de usuários. Durante a configuração, os nomes são resolvidos para IDs usando a busca de contatos em processo do Plugin.

Aprove via:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acesso a grupos (opcional)

- Padrão: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Use `channels.defaults.groupPolicy` para substituir o padrão quando não definido.
- Restrinja a uma allowlist com:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (as chaves devem ser IDs de grupo estáveis; nomes são resolvidos para IDs na inicialização quando possível)
  - `channels.zalouser.groupAllowFrom` (controla quais remetentes em grupos permitidos podem acionar o bot)
- Bloqueie todos os grupos: `channels.zalouser.groupPolicy = "disabled"`.
- O assistente de configuração pode solicitar allowlists de grupos.
- Na inicialização, o OpenClaw resolve nomes de grupos/usuários em allowlists para IDs e registra o mapeamento em log.
- A correspondência da allowlist de grupos é somente por ID por padrão. Nomes não resolvidos são ignorados para autenticação, a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esteja habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` é um modo de compatibilidade emergencial que reabilita a correspondência mutável por nome de grupo.
- Se `groupAllowFrom` não estiver definido, o runtime volta para `allowFrom` nas verificações de remetente em grupos.
- As verificações de remetente se aplicam tanto a mensagens normais de grupo quanto a comandos de controle (por exemplo `/new`, `/reset`).

Exemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["1471383327500481391"],
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true },
      },
    },
  },
}
```

### Controle de menções em grupo

- `channels.zalouser.groups.<group>.requireMention` controla se respostas em grupo exigem uma menção.
- Ordem de resolução: id/nome exato do grupo -> slug normalizado do grupo -> `*` -> padrão (`true`).
- Isso se aplica tanto a grupos em allowlist quanto ao modo de grupo aberto.
- Citar uma mensagem do bot conta como uma menção implícita para ativação em grupo.
- Comandos de controle autorizados (por exemplo `/new`) podem contornar o controle de menções.
- Quando uma mensagem de grupo é ignorada porque a menção é obrigatória, o OpenClaw a armazena como histórico de grupo pendente e a inclui na próxima mensagem de grupo processada.
- O limite de histórico de grupo usa `messages.groupChat.historyLimit` por padrão (fallback `50`). Você pode substituir por conta com `channels.zalouser.historyLimit`.

Exemplo:

```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "*": { allow: true, requireMention: true },
        "Work Chat": { allow: true, requireMention: false },
      },
    },
  },
}
```

## Várias contas

Contas são mapeadas para perfis `zalouser` no estado do OpenClaw. Exemplo:

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" },
      },
    },
  },
}
```

## Digitação, reações e confirmações de entrega

- O OpenClaw envia um evento de digitação antes de despachar uma resposta (melhor esforço).
- A ação de reação a mensagem `react` é compatível com `zalouser` em ações de canal.
  - Use `remove: true` para remover um emoji de reação específico de uma mensagem.
  - Semântica de reações: [Reações](/pt-BR/tools/reactions)
- Para mensagens de entrada que incluem metadados de evento, o OpenClaw envia confirmações de entregue + visto (melhor esforço).

## Solução de problemas

**O login não persiste:**

- `openclaw channels status --probe`
- Faça login novamente: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**O nome na allowlist/grupo não foi resolvido:**

- Use IDs numéricos em `allowFrom`/`groupAllowFrom`/`groups`, ou nomes exatos de amigos/grupos.

**Atualizado de uma configuração antiga baseada em CLI:**

- Remova quaisquer suposições antigas sobre processos externos `zca`.
- O canal agora executa totalmente no OpenClaw sem binários externos de CLI.

## Relacionados

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle de menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção
