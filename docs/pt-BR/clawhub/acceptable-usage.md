---
read_when:
    - Analisando uploads quanto a abuso ou violações de políticas
    - Redação de documentação de moderação ou manuais para revisores
    - Decidir se uma skill deve ser ocultada ou se um usuário deve ser banido
sidebarTitle: Acceptable Usage
summary: 'Política do marketplace: o que o ClawHub permite e o que não hospedará.'
title: Uso aceitável
x-i18n:
    generated_at: "2026-07-12T14:56:23Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ace357e7a3e9f4d242f113ad791b254e94ae8a841dd9a864a77c5bac15713132
    source_path: clawhub/acceptable-usage.md
    workflow: 16
---

# Uso aceitável

O ClawHub hospeda Skills, plugins, pacotes e metadados de marketplace para o OpenClaw.
Use esta página para decidir se um conteúdo ou comportamento de publicação deve
estar no ClawHub.

Estas regras se aplicam ao que uma listagem faz, ao que ela solicita que os usuários executem, a como ela
se apresenta e a como os publicadores usam as áreas de descoberta, instalação e
confiança do ClawHub. Para estados de moderação e situação da conta, consulte
[Moderação e segurança da conta](/clawhub/moderation). Para reivindicações de direitos autorais ou outros direitos,
consulte [Solicitações relativas a direitos de conteúdo](/clawhub/content-rights).

## Conteúdo permitido

O ClawHub aceita conteúdo útil, compreensível e publicado de
boa-fé.

| Categoria                                        | Permitido quando                                                                                                                       |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Produtividade de desenvolvedores                  | A listagem ajuda os usuários a criar, testar, migrar, depurar, documentar ou operar software.                                           |
| Fluxos de trabalho de UI, dados e automação       | O escopo é claro, as credenciais necessárias são explícitas e as ações arriscadas incluem opções de revisão, simulação, prévia ou confirmação. |
| Segurança defensiva, moderação e análise de abuso | A ferramenta é apresentada para análise autorizada, preserva evidências e mantém claros os limites de aprovação humana.                |
| Fluxos de trabalho pessoais ou de equipe          | O fluxo de trabalho usa contas baseadas em consentimento, configuração transparente e permissões explícitas.                           |
| Catálogos mantidos                                | Cada listagem é distinta, útil, descrita com precisão e razoavelmente mantida.                                                          |

O contexto importa. O mesmo tópico pode ser aceitável em um ambiente defensivo restrito ou
baseado em consentimento e inaceitável quando empacotado como um fluxo de trabalho de abuso.

## Conteúdo proibido

O ClawHub não hospeda conteúdo cuja finalidade principal seja abuso, fraude, execução
insegura ou violação de direitos.

| Categoria                                                    | Não permitido                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Acesso não autorizado ou contorno de segurança               | Contorno de autenticação, tomada de controle de contas, abuso de limites de taxa, tomada de controle de chamadas em andamento ou de agentes, roubo de sessões reutilizáveis ou aprovação automática de fluxos de pareamento para usuários não aprovados.                                                                                           |
| Abuso de plataforma e evasão de banimento                    | Contas dissimuladas após banimentos, preparação ou cultivo de contas, engajamento falso, automação de múltiplas contas, publicações em massa, bots de spam ou automação criada para evitar detecção.                                                                                                                                               |
| Fraude, golpes e fluxos de trabalho financeiros enganosos    | Certificados ou faturas falsos, fluxos de pagamento enganosos, contato para golpes, prova social falsa, fluxos de trabalho com identidades sintéticas para fraude ou ferramentas de gastos/cobranças sem aprovação humana clara.                                                                                                                    |
| Enriquecimento invasivo à privacidade ou vigilância          | Coleta de contatos para spam, exposição de dados pessoais, perseguição, extração de leads combinada com contato não solicitado, monitoramento oculto, correspondência biométrica sem consentimento ou uso de dados vazados ou conjuntos de dados provenientes de violações.                                                                        |
| Personificação ou manipulação de identidade sem consentimento | Troca de rostos, gêmeos digitais, influenciadores clonados, personas falsas ou outras ferramentas usadas para se passar por alguém ou enganar.                                                                                                                                                                                                   |
| Conteúdo sexual explícito ou geração adulta sem proteções    | Geração de imagens, vídeos ou conteúdo NSFW; wrappers de conteúdo adulto em torno de APIs de terceiros; ou listagens cuja finalidade principal seja conteúdo sexual explícito.                                                                                                                                                                  |
| Requisitos de execução ocultos, inseguros ou enganosos       | Comandos de instalação ofuscados, instaladores via pipe para shell, como conteúdo baixado executado com `sh` ou `bash` sem possibilidade clara de revisão, requisitos não declarados de segredos ou chaves privadas, execução remota de `npx @latest` sem possibilidade clara de revisão ou metadados que ocultem o que a listagem realmente precisa para ser executada. |
| Material que infringe direitos autorais ou outros direitos   | Republicação de Skills, plugins, documentação, ativos de marca ou código proprietário de terceiros sem permissão; violação dos termos de licença; ou personificação do autor ou publicador original.                                                                                                                                             |

## Comportamento proibido no marketplace

O ClawHub também analisa como os publicadores usam o marketplace. Não use o ClawHub para
manipular a descoberta, as métricas, os sinais de confiança, os sistemas de moderação ou a
atenção dos usuários.

Comportamentos proibidos no marketplace incluem:

- publicar em massa um grande número de listagens de baixo esforço, duplicadas, provisórias ou
  geradas por máquina que não aparentem ter valor real para os usuários
- inundar as áreas de pesquisa ou categorias com Skills ou plugins quase idênticos
- publicar centenas de listagens com pouco ou nenhum uso, manutenção, clareza sobre a origem
  ou diferenciação significativa
- inflar artificialmente instalações, downloads, estrelas ou outras métricas de
  engajamento por meio de automação, ciclos de auto-instalação, contas falsas, atividade coordenada,
  engajamento pago ou outro comportamento não orgânico
- criar ou alternar contas para evitar moderação, banimentos, limites de publicador ou
  análise do marketplace
- induzir os usuários ao erro sobre propriedade, origem, recursos, postura de segurança,
  requisitos de instalação ou afiliação a outro projeto ou publicador
- enviar repetidamente conteúdo que já tenha sido ocultado, removido ou bloqueado
  sem corrigir o problema subjacente

Publicações em grande volume não constituem abuso automaticamente. Catálogos grandes são aceitáveis
quando as listagens são significativamente diferentes, descritas com precisão, mantidas
e usadas por usuários reais. Catálogos grandes se tornam um problema de confiança e segurança quando
o volume está associado a listagens superficiais, duplicadas, enganosas, sem manutenção ou
promovidas artificialmente.

## Direitos de conteúdo

Se você acredita que um conteúdo no ClawHub infringe seus direitos autorais ou outros direitos, use
[Solicitações relativas a direitos de conteúdo](/clawhub/content-rights). Não use as denúncias normais do marketplace
para reivindicações de direitos autorais ou outros direitos, a menos que a listagem também seja insegura,
maliciosa ou enganosa.

## Análise e aplicação das regras

O ClawHub pode usar verificações automatizadas, sinais estatísticos de abuso, denúncias de usuários e
análise da equipe para identificar conteúdo inseguro ou comportamento de publicação abusivo. Um sinal
não comprova abuso por si só; ele ajuda o ClawHub a decidir o que precisa de análise.

Podemos:

- ocultar, reter, remover, excluir logicamente ou, quando houver suporte para o tipo de recurso,
  excluir permanentemente listagens que violem as regras
- bloquear downloads ou instalações de versões inseguras
- revogar tokens de API
- excluir logicamente o conteúdo associado
- restringir o acesso à publicação
- banir infratores reincidentes ou graves

Não garantimos que haverá um aviso antes da aplicação das regras em casos de abuso evidente. Consulte
[Moderação e segurança da conta](/clawhub/moderation) para informações sobre denúncias, retenções para moderação,
listagens ocultas, banimentos e situação da conta.
