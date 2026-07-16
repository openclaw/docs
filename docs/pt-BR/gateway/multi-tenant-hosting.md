---
doc-schema-version: 1
read_when:
    - Você está hospedando o OpenClaw para vários usuários ou organizações
    - É necessário escolher um limite de isolamento para as cargas de trabalho dos tenants
summary: Hospede vários domínios de confiança de locatários como uma célula isolada do Gateway do OpenClaw por locatário
title: Hospedagem multilocatário
x-i18n:
    generated_at: "2026-07-16T12:32:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 383d32331b45d40db6fb4ff8242dd9a3cf8898a3ccab19f0372cd06bbd83fc05
    source_path: gateway/multi-tenant-hosting.md
    workflow: 16
---

# Hospedagem multilocatário

O modelo de segurança padrão do OpenClaw estabelece um limite de operador confiável por Gateway, e não um isolamento multilocatário hostil dentro de um único Gateway compartilhado. Portanto, hospedar usuários ou organizações que não compartilham um limite de confiança significa executar uma instância completa e separada do OpenClaw para cada locatário.

`openclaw fleet` chama cada instância isolada de **célula**. Uma célula é um Gateway completo em um contêiner reforçado, com estado, credenciais, espaço de trabalho, contas de canais, token e porta do host exclusiva para loopback próprios.

O Fleet é **experimental**: seus comandos, sinalizadores e perfil de contêiner podem mudar entre versões sem um período de descontinuação.

O Fleet é testado em hosts Linux e macOS. No momento, hosts Windows não foram testados.

## Por que cada locatário precisa de uma célula

Um operador autenticado dentro de um Gateway exerce uma função confiável no plano de controle. Os IDs de sessão selecionam o roteamento; eles não autorizam um locatário em relação a outro. O isolamento do agente pode reduzir os efeitos de conteúdo não confiável e da execução de ferramentas, mas não transforma um Gateway compartilhado em um limite de autorização entre locatários.

Use uma célula por locatário para que cada domínio de confiança tenha um processo de Gateway, um contêiner, uma árvore de estado persistente e uma credencial do Gateway separados. Isso segue o [modelo de segurança do Gateway](/pt-BR/gateway/security): não coloque usuários mutuamente não confiáveis no mesmo processo do OpenClaw nem sob o mesmo usuário do sistema operacional.

## Arquitetura

A CLI do Fleet é um supervisor de ciclo de vida executado no host. Ela registra as células no banco de dados de estado do OpenClaw e solicita a um runtime local do Docker ou Podman que crie, inspecione, inicie, interrompa, substitua e remova seus contêineres. Endpoints de runtime remotos não são compatíveis porque os caminhos de montagem e URLs de loopback do Fleet pertencem ao host local. O Fleet não atua como proxy de mensagens dos locatários nem adiciona um caminho de dados compartilhado no nível da aplicação entre as células.

Cada célula executa a imagem oficial `ghcr.io/openclaw/openclaw` em sua própria rede bridge definida pelo usuário. Bridges separadas impedem o tráfego direto entre IPs de contêineres de células diferentes, mantendo o acesso NAT de saída para provedores e canais. O tráfego de saída é irrestrito por padrão. As células do Podman podem usar `--network internal` para bloquear o tráfego de saída, preservando a porta de loopback publicada do Gateway. Redes internas do Docker interrompem essa porta publicada, portanto o Fleet rejeita essa combinação; aplique a política de tráfego de saída do Docker com regras de firewall do host, como a cadeia `DOCKER-USER`. O Gateway da célula escuta na porta `18789` dentro do contêiner, enquanto o runtime a publica somente em `127.0.0.1:<allocated-port>` no host. Quando o acesso remoto for necessário, um operador poderá colocar um proxy reverso aprovado, um túnel SSH ou uma tailnet na frente desse endpoint de loopback.

O estado persistente do Gateway vem de `<state-dir>/fleet/cells/<tenant>/` e é montado em `/home/node/.openclaw`. As chaves de criptografia dos perfis de autenticação vêm do caminho separado `<state-dir>/fleet/auth-profile-secrets/<tenant>/` no host e são montadas em `/home/node/.config/openclaw`, de acordo com o [layout oficial de persistência do Docker](/pt-BR/install/docker#storage-and-persistence). A chave não fica aninhada sob a montagem de estado comum. As contas de canais de cada locatário terminam dentro da célula à qual pertencem; o Fleet não fornece uma conta de canal compartilhada nem um roteador de mensagens recebidas.

Por padrão, a imagem oficial usa o usuário não root `node`, com UID 1000. O Fleet usa mapeamentos de usuário compatíveis com o host para manter graváveis as montagens privadas: o Podman usa `keep-id`, o Docker executado como root usa a identidade não root que o invocou e o Docker sem root mapeia o root do contêiner para o usuário sem privilégios do daemon. O Docker e o Podman aplicam uma nova rotulagem privada `:Z` quando o SELinux está ativo no host. O perfil do contêiner evita recursos privilegiados do host e é adequado à execução sem root, mas a operação sem root é uma escolha e um pré-requisito do runtime do host, e não algo que o Fleet habilita automaticamente.

## Limite de confiança

A multilocação protege os locatários uns dos outros. O operador do Fleet e o host são considerados confiáveis por todos os locatários. A resistência a um host comprometido não é um objetivo.

Isso significa que um administrador do host pode inspecionar a configuração e o ambiente dos contêineres, ler os dados montados das células, substituir imagens ou entrar nos contêineres. Os tokens do Gateway e os valores passados com `--env` ficam visíveis para um administrador por meio da inspeção do Docker ou Podman. Portanto, use controles do host, políticas de acesso administrativo, monitoramento, backups e um gerenciador de segredos aprovado.

A configuração básica impede a exposição acidental da rede por curingas e remove mecanismos comuns de escalonamento de privilégios em contêineres, mas não torna seguro um host não confiável.

## Níveis de isolamento

Escolha o limite adequado aos locatários que você hospeda:

1. **Configuração básica de contêiner reforçado.** O Fleet remove todas as capabilities do Linux, habilita `no-new-privileges`, aplica limites de PID, memória, CPU e, opcionalmente, de disco da camada gravável, usa montagens persistentes e redes separadas por célula e publica somente no loopback do host. A rede bridge mantém o tráfego de saída irrestrito; use `--network internal` do Podman ou uma política de firewall do host para o Docker quando uma célula não puder iniciar conexões de saída. Esse é o perfil padrão para locatários que confiam no operador e no host.
2. **Isolamento mais robusto de contêiner ou VM.** Para cargas de trabalho de maior risco, configure o Docker ou Podman para usar um runtime de isolamento OCI mais robusto, como gVisor ou Kata Containers, ou coloque as células em microVMs. Essa é uma configuração do runtime ou da infraestrutura; a opção `--runtime docker|podman` do Fleet escolhe a CLI do contêiner, não o backend de isolamento OCI. Consulte os [runtimes de contêiner alternativos](https://docs.docker.com/engine/daemon/alternative-runtimes/) do Docker e o [guia de runtime de VM do Docker](/pt-BR/install/docker-vm-runtime).
3. **Máquinas separadas para locatários hostis.** Não coloque locatários hostis no mesmo processo do OpenClaw nem sob o mesmo usuário do sistema operacional. Quando os locatários não confiarem no mesmo operador do host ou precisarem de um limite administrativo mais robusto, use VMs ou hosts físicos separados, com administração de runtime separada.

Nenhum nível dessa hierarquia altera o modelo de confiança da aplicação OpenClaw: um Gateway continua sendo um domínio de operador confiável.

## Início rápido

Crie uma célula. O comando exibe uma única vez o token gerado do Gateway; portanto, armazene-o imediatamente:

```bash
openclaw fleet create acme
```

Abra a URL `http://127.0.0.1:<port>` informada no host do Fleet, autentique-se com o token desse locatário e configure as credenciais do provedor e as contas de canais dentro da célula.

Verifique o estado do contêiner e a disponibilidade do Gateway:

```bash
openclaw fleet status acme
```

Atualize preservando a porta do host, os dados montados, o perfil de recursos, o ambiente fornecido pelo usuário e o token do Gateway:

```bash
openclaw fleet upgrade acme
```

Remova o contêiner e o registro no catálogo, preservando os dados do locatário:

```bash
openclaw fleet rm acme --force
```

Para excluir também os dados persistentes do locatário, adicione `--purge-data`. A limpeza exige `--force`, é irreversível e realiza uma verificação de contenção do caminho resolvido antes de excluir qualquer coisa:

```bash
openclaw fleet rm acme --purge-data --force
```

Consulte a [referência da CLI `openclaw fleet`](/pt-BR/cli/fleet) para ver todos os comandos e opções.

## Escopo atual

O Fleet não fornece estes recursos:

- Contas de canais compartilhadas ou um roteador de entrada compartilhado
- Processos de host simplificados por locatário em vez de instâncias completas do OpenClaw
- Hosts de células remotos gerenciados por um único supervisor
- Um portal de autoatendimento para locatários, um plano de cobrança ou uma interface de administração delegada

Esses recursos exigem contratos explícitos de identidade, roteamento, autorização e domínios de falha. Não tente aproximá-los compartilhando um Gateway ou suas credenciais entre locatários. O Fleet é um supervisor de ciclo de vida para um único host; frotas distribuídas entre várias máquinas e controladas por identidade exigem uma camada separada de plano de controle.

## Relacionados

- [`openclaw fleet`](/pt-BR/cli/fleet)
- [Segurança do Gateway](/pt-BR/gateway/security)
- [Vários gateways](/pt-BR/gateway/multiple-gateways)
- [Docker](/pt-BR/install/docker)
- [Podman](/pt-BR/install/podman)
