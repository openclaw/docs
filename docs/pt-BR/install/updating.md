---
read_when:
    - Atualizando o OpenClaw
    - Algo quebra após uma atualização
summary: Atualizando o OpenClaw com segurança (instalação global ou a partir do código-fonte), além da estratégia de reversão
title: Atualizando
x-i18n:
    generated_at: "2026-07-05T02:03:45Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: aaab9de5c41b8a9ce087a182b9cabe34fbf2e6d14524b10248c5403a2644208a
    source_path: install/updating.md
    workflow: 16
---

Mantenha o OpenClaw atualizado.

## Recomendado: `openclaw update`

A maneira mais rápida de atualizar. Ele detecta seu tipo de instalação (npm ou git), busca a versão mais recente, executa `openclaw doctor` e reinicia o Gateway.

```bash
openclaw update
```

Para trocar de canais ou mirar uma versão específica:

```bash
openclaw update --channel beta
openclaw update --channel extended-stable
openclaw update --channel dev
openclaw update --dry-run   # preview without applying
```

`openclaw update` não aceita `--verbose`. Para diagnósticos de atualização, use
`--dry-run` para pré-visualizar as ações planejadas, `--json` para resultados estruturados ou
`openclaw update status --json` para inspecionar o canal e o estado de disponibilidade. O
instalador tem seu próprio sinalizador `--verbose`, mas esse sinalizador não faz parte de
`openclaw update`.

`--channel beta` prefere beta, mas o runtime recorre para stable/latest quando
a tag beta está ausente ou é mais antiga que a versão stable mais recente. Use `--tag beta`
se quiser o dist-tag beta bruto do npm para uma atualização de pacote pontual.

`--channel extended-stable` é somente para pacote e somente em primeiro plano. O OpenClaw lê
o seletor público `extended-stable` do npm, verifica o pacote exato selecionado
e instala essa versão exata. Dados de registro ausentes ou inconsistentes falham
de forma fechada; ele nunca recorre para `latest`. Se a versão selecionada for mais antiga que
a versão instalada, a confirmação normal de downgrade ainda se aplica.

Use `--channel dev` para um checkout persistente e móvel do `main` do GitHub. Para atualizações
de pacote, `--tag main` mapeia para `github:openclaw/openclaw#main` por uma execução, e
especificações de origem GitHub/git são empacotadas em um tarball temporário antes da instalação
npm preparada.

Para plugins gerenciados, o fallback do canal beta é um aviso: a atualização do core ainda pode
ter sucesso enquanto um Plugin usa sua versão default/latest registrada porque nenhum
beta do Plugin está disponível.

Veja [Canais de desenvolvimento](/pt-BR/install/development-channels) para a semântica dos canais.

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

Execute com `--dry-run` primeiro para pré-visualizar a troca exata de modo de instalação:

```bash
openclaw update --channel dev --dry-run
openclaw update --channel stable --dry-run
```

O canal `dev` garante um checkout git, o compila e instala a CLI global
a partir desse checkout. Os canais `stable`, `extended-stable` e `beta` usam
instalações de pacote. Extended-stable é rejeitado em um checkout Git sem
alterá-lo ou convertê-lo. Se o
Gateway já estiver instalado, `openclaw update` atualiza os metadados do serviço
e o reinicia, a menos que você passe `--no-restart`.

Para instalações de pacote com um serviço Gateway gerenciado, `openclaw update` mira
a raiz do pacote usada por esse serviço. Se o comando de shell `openclaw` vier
de uma instalação diferente, o atualizador imprime ambas as raízes e o caminho do Node
do serviço gerenciado. A atualização do pacote usa o gerenciador de pacotes que possui a raiz
do serviço e verifica o Node do serviço gerenciado em relação ao engine da versão-alvo
antes de substituir o pacote.

## Alternativa: executar o instalador novamente

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Adicione `--no-onboard` para pular o onboarding. Para forçar um tipo de instalação específico pelo
instalador, passe `--install-method git --no-onboard` ou
`--install-method npm --no-onboard`.

Se `openclaw update` falhar após a fase de instalação do pacote npm, execute o
instalador novamente. O instalador não chama o atualizador antigo; ele executa a instalação
do pacote global diretamente e pode recuperar uma instalação npm parcialmente atualizada.

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

Prefira `openclaw update` para instalações supervisionadas, porque ele pode coordenar a
troca de pacote com o serviço Gateway em execução. Se você atualizar manualmente em uma
instalação supervisionada, pare o Gateway gerenciado antes que o gerenciador de pacotes comece.
Gerenciadores de pacotes substituem arquivos no local, e um Gateway em execução pode, caso contrário,
tentar carregar arquivos do core ou de plugins enquanto a árvore de pacotes está temporariamente semitrocada.
Reinicie o Gateway depois que o gerenciador de pacotes terminar para que o serviço use
a nova instalação.

Para uma instalação global de sistema Linux pertencente ao root, se `openclaw update` falhar com
`EACCES` e você recuperar com o npm do sistema, mantenha o Gateway parado durante a
substituição manual do pacote. Use os mesmos sinalizadores de perfil `openclaw` ou ambiente
que você normalmente usa para esse Gateway. Substitua `/usr/bin/npm` pelo npm do sistema
que possui o prefixo global pertencente ao root no seu host:

```bash
openclaw gateway stop
sudo /usr/bin/npm i -g openclaw@latest
openclaw gateway install --force
openclaw gateway restart
```

Depois, verifique o serviço:

```bash
openclaw --version
curl -fsS http://127.0.0.1:18789/readyz
openclaw plugins list --json
openclaw gateway status --deep --json
openclaw doctor --lint --json
```

Quando `openclaw update` gerencia uma instalação npm global, ele primeiro instala o alvo em
um prefixo npm temporário, verifica o inventário `dist` empacotado e então troca
a árvore de pacotes limpa para o prefixo global real. Isso evita que o npm sobreponha um
novo pacote a arquivos obsoletos do pacote antigo. Se o comando de instalação falhar,
o OpenClaw tenta novamente uma vez com `--omit=optional`. Essa nova tentativa ajuda hosts em que dependências
opcionais nativas não conseguem compilar, mantendo a falha original visível
se o fallback também falhar.

Comandos de atualização npm e atualização de Plugin gerenciados pelo OpenClaw também limpam a quarentena
`min-release-age` do npm para o processo npm filho. O npm pode relatar essa
política como um corte derivado `before`; ambos são úteis para políticas gerais de quarentena
de cadeia de suprimentos, mas uma atualização explícita do OpenClaw significa "instalar a versão
selecionada do OpenClaw agora."

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Tópicos avançados de instalação npm

<AccordionGroup>
  <Accordion title="Árvore de pacotes somente leitura">
    O OpenClaw trata instalações globais empacotadas como somente leitura em runtime, mesmo quando o diretório global de pacotes pode ser escrito pelo usuário atual. Instalações de pacotes de Plugin ficam em raízes npm/git pertencentes ao OpenClaw sob o diretório de configuração do usuário, e a inicialização do Gateway não altera a árvore de pacotes do OpenClaw.

    Algumas configurações npm no Linux instalam pacotes globais em diretórios pertencentes ao root, como `/usr/lib/node_modules/openclaw`. O OpenClaw oferece suporte a esse layout porque comandos de instalação/atualização de Plugin escrevem fora desse diretório global de pacotes.

  </Accordion>
  <Accordion title="Unidades systemd endurecidas">
    Dê ao OpenClaw acesso de escrita às suas raízes de configuração/estado para que instalações explícitas de Plugin, atualizações de Plugin e limpeza do doctor possam persistir suas alterações:

    ```ini
    ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
    ```

  </Accordion>
  <Accordion title="Pré-verificação de espaço em disco">
    Antes de atualizações de pacote e instalações explícitas de Plugin, o OpenClaw tenta uma verificação de espaço em disco de melhor esforço para o volume-alvo. Pouco espaço produz um aviso com o caminho verificado, mas não bloqueia a atualização porque cotas de sistema de arquivos, snapshots e volumes de rede podem mudar após a verificação. A instalação real pelo gerenciador de pacotes e a verificação pós-instalação continuam sendo autoritativas.
  </Accordion>
</AccordionGroup>

## Atualizador automático

O atualizador automático fica desativado por padrão. Ative-o em `~/.openclaw/openclaw.json`:

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

| Canal             | Comportamento                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| `stable`          | Aguarda `stableDelayHours` e então aplica com jitter determinístico ao longo de `stableJitterHours` (lançamento distribuído). |
| `extended-stable` | Sem verificação na inicialização ou aplicação automática. Use `openclaw update` ou `openclaw update status` manualmente. |
| `beta`            | Verifica a cada `betaCheckIntervalHours` (padrão: a cada hora) e aplica imediatamente.                       |
| `dev`             | Sem aplicação automática. Use `openclaw update` manualmente.                                                 |

O Gateway também registra uma dica de atualização na inicialização (desative com `update.checkOnStart: false`).
Seleções extended-stable armazenadas pulam completamente a resolução na inicialização e em segundo plano.
Para downgrade ou recuperação de incidente, defina `OPENCLAW_NO_AUTO_UPDATE=1` no ambiente do Gateway para bloquear aplicações automáticas mesmo quando `update.auto.enabled` estiver configurado. Dicas de atualização na inicialização ainda podem ser executadas, a menos que `update.checkOnStart` também esteja desativado.

Atualizações de gerenciador de pacotes solicitadas pelo manipulador do plano de controle do Gateway em execução
não substituem a árvore de pacotes dentro do processo Gateway em execução. Em instalações de serviço
gerenciado, o Gateway inicia uma transferência destacada, sai e deixa o
caminho normal da CLI `openclaw update --yes --json` parar o serviço, substituir o
pacote, atualizar os metadados do serviço, reiniciar, verificar a versão e
alcançabilidade do Gateway, e recuperar um LaunchAgent do macOS instalado mas não carregado quando
possível. Se o Gateway não puder fazer essa transferência com segurança, `update.run` relata um
comando de shell seguro em vez de executar o gerenciador de pacotes dentro do processo.

## Depois de atualizar

<Steps>

### Executar doctor

```bash
openclaw doctor
```

Migra a configuração, audita políticas de DM e verifica a saúde do Gateway. Detalhes: [Doctor](/pt-BR/gateway/doctor)

### Reiniciar o Gateway

```bash
openclaw gateway restart
```

### Verificar

```bash
openclaw health
```

</Steps>

## Rollback

### Fixar uma versão (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

<Tip>
`npm view openclaw version` mostra a versão publicada atual.
</Tip>

### Fixar um commit (código-fonte)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Para voltar para a mais recente: `git checkout main && git pull`.

## Se você estiver travado

- Execute `openclaw doctor` novamente e leia a saída com atenção.
- Para `openclaw update --channel dev` em checkouts de código-fonte, o atualizador inicializa automaticamente o `pnpm` quando necessário. Se você vir um erro de bootstrap do pnpm/corepack, instale o `pnpm` manualmente (ou reative o `corepack`) e execute a atualização novamente.
- Confira: [Solução de problemas](/pt-BR/gateway/troubleshooting)
- Pergunte no Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Relacionados

- [Visão geral de instalação](/pt-BR/install): todos os métodos de instalação.
- [Doctor](/pt-BR/gateway/doctor): verificações de saúde após atualizações.
- [Migração](/pt-BR/install/migrating): guias de migração de versões principais.
