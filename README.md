# EmbodiedZip website

EmbodiedZip 项目网站。网站源码公开于 **[LxRoboticsLab/EmbodiedZip-website](https://github.com/LxRoboticsLab/EmbodiedZip-website)**，通过 GitHub Pages 发布：

**https://lxroboticslab.github.io/EmbodiedZip-website/**

研究框架仓库保持私有，网站开发在其独立 `website` 分支进行。公开仓库只包含本目录的内容（网站、图示、测试和 Pages 工作流），不包含模型、推理代码、研究仓库历史、数据、权重或凭证。公开站点的链接指向本站内容和公开网站仓库。

## 本地查看

克隆公开网站仓库后，在仓库根目录运行（可使用已有 Conda 环境）：

```bash
python -m http.server 8080
```

访问 `http://localhost:8080`。

在研究框架仓库的 `website` 分支中，使用 `python -m http.server 8080 --directory website`。所有资源采用相对路径，兼容 GitHub Pages 项目子路径。

网站采用 HTML、CSS 和原生 ES modules，无需框架、打包或 npm 依赖。Google Fonts 可离线回退到系统字体；没有第三方 JS、分析跟踪或模型运行依赖。

## 文件说明

- `index.html`：介绍、排行榜、任务展示、效率分析、Policy Serving、评估方法。
- `styles.css`：响应式布局与样式。
- `data.mjs`：规划配置、任务类别、指标定义与筛选/排序/CSV 逻辑。
- `app.mjs`：交互、键盘可访问 tabs、配置对比、任务切换与导出。
- `assets/`：原创 SVG 示意图，不是实机记录。
- `tests/`：数据真实性与筛选、排序、CSV 边界测试。
- `.github/workflows/pages.yml`：公开网站仓库的 Pages 工作流。

## Project status

**Framework preview — no measured results published.**

已建立共享数据契约、推理协议、配置查看工具、同步接口模拟示例和 policy serving 接口骨架。首个模型与 benchmark、加速算法、执行后端、远程服务和真实评估仍待接入。

网站所有实验指标为 `null`，显示为 `—`，CSV 导出为空字段。规划配置不是已运行的实验；benchmark 候选不是已接入能力；任务类别是示意；视频与图表为标记清楚的 placeholder。更新结果时需附模型、benchmark、硬件和可复现运行来源。真实图表渲染与分布数据绑定将在首批结果接入时实现。

近期方向：首个模型和同步闭环基线 → Policy Server / Client → 完整运行清单与指标 → 单项优化消融 → 异步 / RTC 与多 benchmark。

设计参考 [AA-Robotics](https://artificialanalysis.ai/articles/aa-robotics#leaderboard) 的信息层次。本站没有复制其品牌、实验结果或视频。

## 验证

Node.js 20+，无需安装依赖：

```bash
npm run check
```

在研究框架仓库中先执行 `cd website`。另已用 Chromium 验证搜索、筛选、对比、任务切换、指标 tabs、键盘操作、CSV 下载及 320–1440 px 响应式布局。

## 发布与维护

公开网站仓库 `main` 分支更新后，工作流自动执行检查并发布 Pages。首次发布设置：**Settings → Pages → Source → GitHub Actions**。部署成功后，站点地址如上。

建议在研究框架的 `website` 分支维护原始内容，并且**仅将 `website/` 目录内容同步至公开网站仓库根目录**。原私有仓库根目录的 `.github/workflows/website-checks.yml` 只运行检查；Pages 部署使用公开仓库中的 `.github/workflows/pages.yml`。

不要将两个仓库的 Git 历史合并，不要公开整个研究框架仓库，也不要复制私有仓库的 `.git/`、凭证、模型、数据或权重。使用两个独立 checkout 即可：将本目录文件同步到公开 checkout 后检查、提交并推送其 `main` 分支。
