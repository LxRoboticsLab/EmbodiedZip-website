# EmbodiedZip website

EmbodiedZip 项目网站。网站源码公开于 **[LxRoboticsLab/EmbodiedZip-website](https://github.com/LxRoboticsLab/EmbodiedZip-website)**，通过 GitHub Pages 发布：

**https://lxroboticslab.github.io/EmbodiedZip-website/**

研究框架仓库保持私有，网站在本公开仓库中独立开发和部署。本地目录为 `/mnt/sda1/EmbodiedZip-website`；原研究框架仓库仅保留 `main` 分支。本站仓库只包含网站、图示、测试和 Pages 工作流，不包含模型、推理代码、研究仓库历史、数据、权重或凭证。公开站点不展示网站源码仓库入口；Rerun 查看器使用官方托管页面。

## 本地查看

克隆公开网站仓库后，在仓库根目录运行（可使用已有 Conda 环境）：

```bash
python -m http.server 8080
```

访问 `http://localhost:8080`。

所有资源采用相对路径，兼容 GitHub Pages 项目子路径。

网站采用 HTML、CSS 和原生 ES modules，无需框架、打包或 npm 依赖。Google Fonts 可离线回退到系统字体；主页面没有第三方 JS 或模型运行依赖；Task Explorer 按需加载 Rerun 官方托管 iframe。

## 文件说明

- `index.html`：介绍、排行榜、任务展示、效率分析、评估方法。
- `styles.css`：响应式布局与样式。
- `data.mjs`：规划配置、任务类别、指标定义与筛选/排序/CSV 逻辑。
- `app.mjs`：交互、键盘可访问 tabs、配置对比、任务切换与导出。
- `section-navigation.mjs`：按章节顶部位置与阅读线统一判定目录，支持长章节、反向滚动、锚点跳转与内容高度变化。
- `recording-viewer.mjs`：Rerun iframe、任务录制切换、录制 URL、版本匹配与全屏。
- `landscape.mjs`：latency × memory × success rate 三维结果总览，支持拖动旋转、键盘滑块及二维投影视图；自动使用表格筛选与配置选择。
- `assets/`：原创 SVG 示意图，不是实机记录。
- `tests/`：数据真实性与筛选、排序、CSV 边界测试。
- `.github/workflows/pages.yml`：公开网站仓库的 Pages 工作流。

## Project status

**Framework preview — no measured results published.**

已建立共享数据契约、推理协议、配置查看工具、同步接口模拟示例和 policy serving 接口骨架。首个模型与 benchmark、加速算法、执行后端、远程服务和真实评估仍待接入。

网站所有实验指标为 `null`，显示为 `—`，CSV 导出为空字段。规划配置不是已运行的实验；benchmark 候选不是已接入能力；任务类别是示意；任务录制尚未提供，Rerun 查看器默认打开空态；图表为标记清楚的 placeholder。更新结果时需附模型、benchmark、硬件和可复现运行来源。三维总览仅绘制三项指标均完整且有效的测量结果，缺失数据不会被当作 0。Latency、memory 从 0 开始，范围根据完整结果自动设置，success rate 固定为 0–100%。无数据时不显示虚构刻度或数据点；二维分析卡片的分布渲染将在首批结果接入时实现。

近期方向：首个模型和同步闭环基线 → Policy Server / Client → 完整运行清单与指标 → 单项优化消融 → 异步 / RTC 与多 benchmark。

设计参考 [AA-Robotics](https://artificialanalysis.ai/articles/aa-robotics#leaderboard) 的信息层次。本站没有复制其品牌、实验结果或视频。

## Task Explorer / Rerun

Task Explorer 嵌入真实的 [Rerun Web Viewer](https://rerun.io/docs/howto/integrations/embed-web)，默认固定为 `0.42.0`，采用 WebGL 兼容渲染，在接近该章节时按需加载。使用 WebGL 是为了避免部分设备/软件 GPU 的 WebGPU 空白画布；该选项遵循 [Rerun 官方图形排查说明](https://rerun.io/docs/getting-started/install-rerun/troubleshooting)。查看器使用完整布局，不隐藏实体/选择面板或时间轴；也可全屏或在新窗口打开。

- 回放：使用 Rerun 内部时间轴查看场景、图像和轨迹。
- 查看数据：选择实体检查记录的组件值；在 Rerun 中添加 Dataframe、Raw Data 或 Time Series 视图，查看录制里实际存在的数据。未记录的量不会自动生成。
- 本地文件：通过 Rerun 自身文件菜单打开 `.rrd`，或拖入查看器；页面表单用于加载 HTTP(S) URL，不是上传接口。
- 远程文件：输入可供浏览器读取、允许 CORS 的录制地址。文件使用 HTTPS 时适用于公开 Pages；不要将本机 `file://` 路径当作可共享地址。
- 版本：填写生成录制时使用的 Rerun SDK 版本，表单会生成对应的固定版本查看器地址。
- 状态：iframe 的 load 事件仅表示页面打开，不证明录制已成功解码；录制加载错误在 Rerun 内显示。外部查看器不可用时，可使用新窗口入口。

要为一个任务接入已发布录制，在 `data.mjs` 的对应 task 中将 `recording: null` 替换为：

```js
recording: {
  url: './recordings/<episode>.rrd',
  sdkVersion: '0.42.0',
  label: '<recording description>'
}
```

这只是配置示例，不对应实际文件。录制相对地址以站点页面为基准解析，兼容 GitHub Pages 子路径。切换任务会清理上一任务/自定义录制的 iframe；未配置录制时不会继续展示旧任务数据。自定义录制不会影响任务成绩和 Leaderboard。

较大的录制可放在支持浏览器跨域访问的对象存储中，不必提交进网站仓库。需要保存同步时间轴、相机、机器人状态/动作以及所需标量，才能在同一查看器中关联过程和具体数据；推荐与录制一起保存 Rerun blueprint 定义默认布局。

## 验证

Node.js 20+，无需安装依赖：

```bash
npm run check
```

已用 Chromium 验证搜索、筛选、对比、任务切换、指标 tabs、键盘操作、CSV 下载及 320–1440 px 响应式布局。

## 发布与维护

公开网站仓库 `main` 分支更新后，工作流自动执行检查并发布 Pages。首次发布设置：**Settings → Pages → Source → GitHub Actions**。部署成功后，站点地址如上。

直接在本仓库维护网站，Pages 部署使用 `.github/workflows/pages.yml`：

```bash
cd /mnt/sda1/EmbodiedZip-website
# 修改网站内容
npm run check
git add <修改的文件>
git commit -m "Update project website"
git push origin main
```

研究框架与网站使用独立仓库及 Git 历史。提交到网站仓库的内容会公开，请仅提交网站所需的源码与资源。
