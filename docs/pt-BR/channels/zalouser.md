---
read_when:
    - Configurando o Zalo pessoal para o OpenClaw
    - Depurando o login ou o fluxo de mensagens do Zalo pessoal
summary: Suporte a conta pessoal do Zalo via zca-js nativo (login por QR), recursos e configuração
title: Zalo pessoal
x-i18n:
    generated_at: "2026-04-24T05:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18a7edbe3e7a65861628f004ecf6cf2b924b531ba7271d14fa37a6834cdd2545
    source_path: channels/zalouser.md
    workflow: 15
---

# Zalo pessoal (não oficial)

Status: experimental. Esta integração automatiza uma **conta pessoal do Zalo** por meio de `zca-js` nativo dentro do OpenClaw.

> **Aviso:** Esta é uma integração não oficial e pode resultar em suspensão/banimento da conta. Use por sua conta e risco.

## Plugin incluído

O Zalo pessoal é fornecido como um Plugin incluído nas versões atuais do OpenClaw, então compilações
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui o Zalo pessoal,
instale-o manualmente:

- Instale via CLI: `openclaw plugins install @openclaw/zalouser`
- Ou a partir de um checkout do código-fonte: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalhes: [Plugins](/pt-BR/tools/plugin)

Nenhum binário externo de CLI `zca`/`openzca` é necessário.

## Configuração rápida (iniciante)

1. Verifique se o Plugin Zalo pessoal está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Faça login (QR, na máquina do Gateway):
   - `openclaw channels login --channel zalouser`
   - Escaneie o código QR com o aplicativo móvel do Zalo.
3. Ative o canal:

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
5. O acesso por DM usa pairing por padrão; aprove o código de pairing no primeiro contato.

## O que é

- Executa inteiramente em processo via `zca-js`.
- Usa listeners de eventos nativos para receber mensagens de entrada.
- Envia respostas diretamente pela API JS (texto/mídia/link).
- Projetado para casos de uso de “conta pessoal” em que a API oficial de bot do Zalo não está disponível.

## Nomenclatura

O ID do canal é `zalouser` para deixar explícito que isso automatiza uma **conta de usuário pessoal do Zalo** (não oficial). Mantemos `zalo` reservado para uma possível integração futura com a API oficial do Zalo.

## Encontrando IDs (diretório)

Use a CLI de diretório para descobrir contatos/grupos e seus IDs:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- O texto de saída é dividido em chunks de ~2000 caracteres (limites do cliente Zalo).
- O streaming é bloqueado por padrão.

## Controle de acesso (DMs)

`channels.zalouser.dmPolicy` aceita: `pairing | allowlist | open | disabled` (padrão: `pairing`).

`channels.zalouser.allowFrom` aceita IDs de usuário ou nomes. Durante a configuração, nomes são resolvidos para IDs usando a busca de contatos em processo do Plugin.

Aprove com:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acesso a grupos (opcional)

- Padrão: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Use `channels.defaults.groupPolicy` para substituir o padrão quando não estiver definido.
- Restrinja a uma allowlist com:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (as chaves devem ser IDs de grupo estáveis; nomes são resolvidos para IDs na inicialização quando possível)
  - `channels.zalouser.groupAllowFrom` (controla quais remetentes em grupos permitidos podem acionar o bot)
- Bloqueie todos os grupos: `channels.zalouser.groupPolicy = "disabled"`.
- O assistente de configuração pode solicitar allowlists de grupo.
- Na inicialização, o OpenClaw resolve nomes de grupos/usuários em allowlists para IDs e registra o mapeamento.
- A correspondência da allowlist de grupos usa apenas ID por padrão. Nomes não resolvidos são ignorados para autenticação, a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esteja ativado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` é um modo de compatibilidade break-glass que reativa a correspondência por nome de grupo mutável.
- Se `groupAllowFrom` não estiver definido, o runtime recorre a `allowFrom` para verificações de remetente de grupo.
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

### Restrição por menção em grupos

- `channels.zalouser.groups.<group>.requireMention` controla se respostas em grupo exigem uma menção.
- Ordem de resolução: ID/nome exato do grupo -> slug normalizado do grupo -> `*` -> padrão (`true`).
- Isso se aplica tanto a grupos em allowlist quanto ao modo de grupo aberto.
- Citar uma mensagem do bot conta como uma menção implícita para ativação em grupo.
- Comandos de controle autorizados (por exemplo `/new`) podem ignorar a restrição por menção.
- Quando uma mensagem de grupo é ignorada porque uma menção é exigida, o OpenClaw a armazena como histórico de grupo pendente e a inclui na próxima mensagem de grupo processada.
- O limite do histórico de grupo usa por padrão `messages.groupChat.historyLimit` (fallback `50`). Você pode substituir por conta com `channels.zalouser.historyLimit`.

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

As contas são mapeadas para perfis `zalouser` no estado do OpenClaw. Exemplo:

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
- A ação de reação de mensagem `react` é compatível com `zalouser` em ações de canal.
  - Use `remove: true` para remover um emoji de reação específico de uma mensagem.
  - Semântica de reação: [Reactions](/pt-BR/tools/reactions)
- Para mensagens de entrada que incluem metadados de evento, o OpenClaw envia confirmações de entregue + visto (melhor esforço).

## Solução de problemas

**O login não persiste:**

- `openclaw channels status --probe`
- Faça login novamente: `openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`

**O nome em allowlist/grupo não foi resolvido:**

- Use IDs numéricos em `allowFrom`/`groupAllowFrom`/`groups`, ou nomes exatos de amigos/grupos.

**Atualizou de uma configuração antiga baseada em CLI:**

- Remova quaisquer suposições antigas de processo externo `zca`.
- O canal agora é executado totalmente dentro do OpenClaw, sem binários de CLI externos.

## Relacionado

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pairing
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e restrição por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
