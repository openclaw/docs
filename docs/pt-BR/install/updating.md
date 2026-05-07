---
read_when:
    - Atualizando o OpenClaw
    - Algo deixa de funcionar após uma atualização
summary: Atualizando o OpenClaw com segurança (instalação global ou a partir do código-fonte), além da estratégia de reversão
title: Atualização
x-i18n:
    generated_at: "2026-05-07T01:52:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: 520f30980c56b9bcfc78bb2e916df812b2770a88c663140eeee3e9697bf58ee6
    source_path: install/updating.md
    workflow: 16
---

Mantenha o OpenClaw atualizado.

## Recomendado: `openclaw update`

A forma mais rápida de atualizar. Ele detecta seu tipo de instalação (npm ou git), busca a versão mais recente, executa `openclaw doctor` e reinicia o Gateway.

```bash
openclaw update
```

Para trocar de canais ou mirar uma versão específica:

```bash
openclaw update --channel beta
openclaw update --channel dev
openclaw update --tag main
openclaw update --dry-run   # preview without applying
```

`openclaw update` não aceita `--verbose`. Para diagnósticos de atualização, use
`--dry-run` para pré-visualizar as ações planejadas, `--json` para resultados estruturados ou
`openclaw update status --json` para inspecionar o estado do canal e da disponibilidade. O
instalador tem sua própria flag `--verbose`, mas essa flag não faz parte de
`openclaw update`.

`--channel beta` prefere beta, mas o runtime volta para stable/latest quando
a tag beta está ausente ou é mais antiga que a versão stable mais recente. Use `--tag beta`
se quiser a dist-tag beta bruta do npm para uma atualização pontual de pacote.

O OpenClaw ainda não expõe um canal de atualização de suporte LTS ou mensal. Estamos
trabalhando para chegar a linhas de suporte mensal compatíveis com SemVer, mas hoje os canais
compatíveis ainda são `stable`, `beta` e `dev`.

Consulte [Canais de desenvolvimento](/pt-BR/install/development-channels) para a semântica dos canais.

## Alternar entre instalações npm e git

Use canais quando quiser alterar o tipo de instalação. O atualizador mantém seu
estado, configuração, credenciais e workspace em `~/.openclaw`; ele altera apenas
qual instalação do código do OpenClaw a CLI e o Gateway usam.

```bash
# npm package install -> editable git checkout
openclaw update --channel dev

# git checkout -> npm package install
openclaw update --channel stable
```

Execute primeiro com `--dry-run` para pré-visualizar a troca exata do modo de instalação:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

O canal `dev` garante um checkout git, o compila e instala a CLI global
a partir desse checkout. Os canais `stable` e `beta` usam instalações de pacote. Se o
Gateway já estiver instalado, `openclaw update` atualiza os metadados do serviço
e o reinicia, a menos que você passe `--no-restart`.

## Alternativa: executar o instalador novamente

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Adicione `--no-onboard` para pular o onboarding. Para forçar um tipo de instalação específico pelo
instalador, passe `--install-method git --no-onboard` ou
`--install-method npm --no-onboard`.

Se `openclaw update` falhar após a fase de instalação do pacote npm, execute o
instalador novamente. O instalador não chama o atualizador antigo; ele executa a instalação
global do pacote diretamente e consegue recuperar uma instalação npm parcialmente atualizada.

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm
```

Para fixar a recuperação em uma versão ou dist-tag específica, adicione `--version`:

```bash
curl -fsSL https://openclaw.ai/install.sh | bash -s -- --install-method npm --version <version-or-dist-tag>
```

## Alternativa: npm, pnpm ou bun manual

```bash
npm i -g openclaw@latest
```

Prefira `openclaw update` para instalações supervisionadas, porque ele consegue coordenar a
troca de pacote com o serviço Gateway em execução. Se você atualizar manualmente enquanto um
Gateway gerenciado estiver em execução, reinicie o Gateway imediatamente depois que o gerenciador de pacotes
terminar, para que o processo antigo não continue servindo a partir de arquivos de pacote substituídos.

Quando `openclaw update` gerencia uma instalação npm global, ele instala o alvo em
um prefixo npm temporário primeiro, verifica o inventário `dist` empacotado e então troca
a árvore de pacote limpa para o prefixo global real. Isso evita que o npm sobreponha um
novo pacote sobre arquivos obsoletos do pacote antigo. Se o comando de instalação falhar,
o OpenClaw tenta novamente uma vez com `--omit=optional`. Essa nova tentativa ajuda hosts em que dependências
opcionais nativas não conseguem compilar, mantendo a falha original visível
se o fallback também falhar.

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Tópicos avançados de instalação npm

<AccordionGroup>
  <Accordion title="Árvore de pacotes somente leitura">
    O OpenClaw trata instalações globais empacotadas como somente leitura em runtime, mesmo quando o diretório global do pacote pode ser escrito pelo usuário atual. Instalações de pacotes de plugin ficam em raízes npm/git pertencentes ao OpenClaw no diretório de configuração do usuário, e a inicialização do Gateway não modifica a árvore de pacotes do OpenClaw.

    Algumas configurações npm do Linux instalam pacotes globais em diretórios pertencentes ao root, como `/usr/lib/node_modules/openclaw`. O OpenClaw oferece suporte a esse layout porque comandos de instalação/atualização de plugin escrevem fora desse diretório global de pacote.

  </Accordion>
  <Accordion title="Unidades systemd reforçadas">
    Conceda ao OpenClaw acesso de escrita às suas raízes de configuração/estado para que instalações explícitas de plugin, atualizações de plugin e limpeza do doctor possam persistir suas alterações:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Pré-verificação de espaço em disco">
    Antes de atualizações de pacote e instalações explícitas de plugin, o OpenClaw tenta uma verificação de espaço em disco de melhor esforço para o volume de destino. Pouco espaço gera um aviso com o caminho verificado, mas não bloqueia a atualização porque cotas de sistema de arquivos, snapshots e volumes de rede podem mudar depois da verificação. A instalação real pelo gerenciador de pacotes e a verificação pós-instalação continuam sendo autoritativas.
  </Accordion>
</AccordionGroup>

## Atualizador automático

O atualizador automático fica desligado por padrão. Habilite-o em `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Canal    | Comportamento                                                                                                      |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| `stable` | Aguarda `stableDelayHours` e então aplica com jitter determinístico ao longo de `stableJitterHours` (lançamento distribuído). |
| `beta`   | Verifica a cada `betaCheckIntervalHours` (padrão: a cada hora) e aplica imediatamente.                              |
| `dev`    | Sem aplicação automática. Use `openclaw update` manualmente.                                                           |

O Gateway também registra uma dica de atualização na inicialização (desabilite com `update.checkOnStart: false`).
Para downgrade ou recuperação de incidente, defina `OPENCLAW_NO_AUTO_UPDATE=1` no ambiente do Gateway para bloquear aplicações automáticas mesmo quando `update.auto.enabled` estiver configurado. Dicas de atualização na inicialização ainda podem ser executadas, a menos que `update.checkOnStart` também esteja desabilitado.

Atualizações do gerenciador de pacotes solicitadas pelo manipulador live do plano de controle do Gateway
forçam uma reinicialização de atualização sem adiamento e sem cooldown após a troca de pacote. Isso
evita deixar um processo antigo em memória por tempo suficiente para carregar chunks sob demanda
de uma árvore de pacote que já foi substituída. O `openclaw update` no shell
continua sendo o caminho preferido para instalações supervisionadas, porque ele consegue parar e
reiniciar o serviço ao redor da atualização.

## Depois de atualizar

<Steps>

### Executar doctor

```bash
openclaw doctor
```

Migra a configuração, audita políticas de DM e verifica a integridade do Gateway. Detalhes: [Doctor](/pt-BR/gateway/doctor)

### Reiniciar o Gateway

```bash
openclaw gateway restart
```

### Verificar

```bash
openclaw health
```

</Steps>

## Reversão

### Fixar uma versão (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` mostra a versão publicada atual.
</Tip>

### Fixar um commit (source)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para voltar para a mais recente: `git checkout main && git pull`.

## Se você estiver travado

- Execute `openclaw doctor` novamente e leia a saída com atenção.
- Para `openclaw update --channel dev` em checkouts de código-fonte, o atualizador inicializa automaticamente o `pnpm` quando necessário. Se você vir um erro de inicialização do pnpm/corepack, instale o `pnpm` manualmente (ou reabilite o `corepack`) e execute a atualização novamente.
- Verifique: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Pergunte no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionado

- [Visão geral da instalação](/pt-BR/install): todos os métodos de instalação.
- [Doctor](/pt-BR/gateway/doctor): verificações de integridade após atualizações.
- [Migração](/pt-BR/install/migrating): guias de migração de versão principal.
