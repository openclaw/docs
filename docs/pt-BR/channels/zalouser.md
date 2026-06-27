---
read_when:
    - Configurando o Zalo Personal para o OpenClaw
    - Depuração do login ou do fluxo de mensagens do Zalo Personal
summary: Suporte a conta pessoal do Zalo via zca-js nativo (login por QR), recursos e configuração
title: Zalo pessoal
x-i18n:
    generated_at: "2026-06-27T17:13:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fdd331d118bfc0d9aba90ac5e42c2ba52e010eafba1342bd3523c64642057dc6
    source_path: channels/zalouser.md
    workflow: 16
---

Status: experimental. Esta integração automatiza uma **conta pessoal do Zalo** via `zca-js` nativo dentro do OpenClaw.

<Warning>
Esta é uma integração não oficial e pode resultar em suspensão ou banimento da conta. Use por sua conta e risco.
</Warning>

## Plugin incluído

Zalo Personal é distribuído como um Plugin incluído nas versões atuais do OpenClaw, portanto builds
empacotados normais não precisam de uma instalação separada.

Se você estiver em um build mais antigo ou em uma instalação personalizada que exclui o Zalo Personal,
instale o pacote npm diretamente:

- Instale via CLI: `openclaw plugins install @openclaw/zalouser`
- Versão fixada: `openclaw plugins install @openclaw/zalouser@2026.5.2`
- Ou a partir de um checkout de código-fonte: `openclaw plugins install ./path/to/local/zalouser-plugin`
- Detalhes: [Plugins](/pt-BR/tools/plugin)

Nenhum binário externo de CLI `zca`/`openzca` é necessário.

## Configuração rápida (iniciante)

1. Garanta que o Plugin Zalo Personal esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
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

- Executa inteiramente dentro do processo via `zca-js`.
- Usa listeners de eventos nativos para receber mensagens de entrada.
- Envia respostas diretamente pela API JS (texto/mídia/link).
- Projetado para casos de uso de "conta pessoal" em que a API Zalo Bot não está disponível.

## Nomenclatura

O ID do canal é `zalouser` para deixar explícito que isso automatiza uma **conta pessoal de usuário do Zalo** (não oficial). Mantemos `zalo` reservado para uma possível futura integração oficial com a API do Zalo.

## Encontrando IDs (diretório)

Use a CLI de diretório para descobrir pares/grupos e seus IDs:

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## Limites

- O texto de saída é dividido em blocos de ~2000 caracteres (limites do cliente Zalo).
- Streaming é bloqueado por padrão.

## Controle de acesso (DMs)

`channels.zalouser.dmPolicy` é compatível com: `pairing | allowlist | open | disabled` (padrão: `pairing`).

`channels.zalouser.allowFrom` deve usar IDs de usuário Zalo estáveis. Também pode referenciar grupos estáticos de acesso de remetentes (`accessGroup:<name>`). Durante a configuração interativa, nomes inseridos podem ser resolvidos para IDs usando a busca de contatos dentro do processo do Plugin.

Se um nome bruto permanecer na configuração, a inicialização só o resolve quando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado. Sem essa adesão explícita, as verificações de remetente em runtime usam apenas IDs, e nomes brutos são ignorados para autorização.

Aprove via:

- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## Acesso a grupos (opcional)

- Padrão: `channels.zalouser.groupPolicy = "open"` (grupos permitidos). Use `channels.defaults.groupPolicy` para substituir o padrão quando não definido.
- Restrinja a uma lista de permissões com:
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups` (as chaves devem ser IDs de grupo estáveis; nomes são resolvidos para IDs na inicialização somente quando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado)
  - `channels.zalouser.groupAllowFrom` (controla quais remetentes em grupos permitidos podem acionar o bot; grupos estáticos de acesso de remetentes podem ser referenciados com `accessGroup:<name>`)
- Bloqueie todos os grupos: `channels.zalouser.groupPolicy = "disabled"`.
- O assistente de configuração pode solicitar listas de permissões de grupos.
- Na inicialização, o OpenClaw resolve nomes de grupos/usuários em listas de permissões para IDs e registra o mapeamento somente quando `channels.zalouser.dangerouslyAllowNameMatching: true` está habilitado.
- A correspondência da lista de permissões de grupos usa apenas IDs por padrão. Nomes não resolvidos são ignorados para autenticação, a menos que `channels.zalouser.dangerouslyAllowNameMatching: true` esteja habilitado.
- `channels.zalouser.dangerouslyAllowNameMatching: true` é um modo de compatibilidade de emergência que reabilita a resolução mutável de nomes na inicialização e a correspondência de nomes de grupos em runtime.
- Se `groupAllowFrom` não estiver definido, o runtime recorre a `allowFrom` para verificações de remetentes de grupos.
- As verificações de remetente se aplicam tanto a mensagens normais de grupo quanto a comandos de controle (por exemplo, `/new`, `/reset`).

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

### Controle por menção em grupo

- `channels.zalouser.groups.<group>.requireMention` controla se respostas em grupo exigem uma menção.
- Ordem de resolução: ID/nome exato do grupo -> slug normalizado do grupo -> `*` -> padrão (`true`).
- Isso se aplica tanto a grupos em lista de permissões quanto ao modo de grupo aberto.
- Citar uma mensagem do bot conta como uma menção implícita para ativação em grupo.
- Comandos de controle autorizados (por exemplo, `/new`) podem contornar o controle por menção.
- Quando uma mensagem de grupo é ignorada porque uma menção é obrigatória, o OpenClaw a armazena como histórico de grupo pendente e a inclui na próxima mensagem de grupo processada.
- O limite de histórico de grupo usa `messages.groupChat.historyLimit` por padrão (fallback `50`). Você pode sobrescrever por conta com `channels.zalouser.historyLimit`.

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

## Múltiplas contas

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

## Variáveis de ambiente

O Plugin Zalo Personal também pode ler a seleção de perfil a partir de variáveis de ambiente:

- `ZALOUSER_PROFILE`: nome do perfil a usar quando nenhum `profile` estiver definido na configuração do canal ou da conta.
- `ZCA_PROFILE`: nome de perfil legado de fallback, usado somente quando `ZALOUSER_PROFILE` não está definido.

Nomes de perfil selecionam as credenciais salvas de login do Zalo no estado do OpenClaw. A ordem de resolução é:

1. `profile` explícito na configuração.
2. `ZALOUSER_PROFILE`.
3. `ZCA_PROFILE`.
4. O ID da conta para contas não padrão, ou `default` para a conta padrão.

Para configurações com múltiplas contas, prefira definir `profile` em cada conta na configuração para que
uma variável de ambiente não faça várias contas compartilharem a mesma sessão
de login.

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

**Nome da lista de permissões/grupo não foi resolvido:**

- Use IDs numéricos em `allowFrom`/`groupAllowFrom` e IDs de grupo estáveis em `groups`. Se você precisar intencionalmente de nomes exatos de amigos/grupos, habilite `channels.zalouser.dangerouslyAllowNameMatching: true`.

**Atualizou a partir da configuração antiga baseada em CLI:**

- Remova quaisquer suposições antigas de processo externo `zca`.
- O canal agora executa totalmente no OpenClaw sem binários externos de CLI.

## Relacionado

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e fortalecimento
