async (dataString) => {
  const parsedData = JSON.parse(dataString);
  if (!parsedData) return;
  const {
    VisualTrackDatas,
    Events: events,
    StationingStart,
    StationingEnd,
    PageWidth,
    PageHeight,
    DefectScale,
    SignalScale,
    DisplayEvents,
    SeverityLimits: chartThresholds,
    TwistBaseLength,
  } = parsedData;

  const chartTypes = [
    {
      id: "VersineVerticalRight",
      shortName: "VVR",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "VersineLimits",
      columnName: "Versine Vertical Right",
    },
    {
      id: "VersineVerticalLeft",
      shortName: "VVL",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "VersineLimits",
      columnName: "Versine Vertical Left",
    },
    {
      id: "VersineHorizontalRight",
      shortName: "VHR",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "VersineLimits",
      columnName: "Versine Horizontal Right",
    },
    {
      id: "VersineHorizontalLeft",
      shortName: "VHL",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "VersineLimits",
      columnName: "Versine Horizontal Left",
    },
    {
      id: "LongitudinalLevelD2Right",
      shortName: "LLD2R",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D2Limits",
      columnName: "Longitudinal Level Right",
    },
    {
      id: "LongitudinalLevelD2Left",
      shortName: "LLD2L",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D2Limits",
      columnName: "Longitudinal Level Left",
    },
    {
      id: "LongitudinalLevelD1Right",
      shortName: "LLD1R",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D1Limits",
      columnName: "Longitudinal Level Right",
    },
    {
      id: "LongitudinalLevelD1Left",
      shortName: "LLD1L",
      shouldShow: false,
      limitName: "VerticalAlignment",
      limitType: "D1Limits",
      columnName: "Longitudinal Level Left",
    },
    {
      id: "AlignmentD2Right",
      shortName: "AD2R",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D2Limits",
      columnName: "Alignment Right",
    },
    {
      id: "AlignmentD2Left",
      shortName: "AD2L",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D2Limits",
      columnName: "Alignment Left",
    },
    {
      id: "AlignmentD1Right",
      shortName: "AD1R",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D1Limits",
      columnName: "Alignment Left",
    },
    {
      id: "AlignmentD1Left",
      shortName: "AD1L",
      shouldShow: false,
      limitName: "HorizontalAlignment",
      limitType: "D1Limits",
      columnName: "Alignment Right",
    },
    {
      id: "TwistBase1",
      shortName: "Twist",
      shouldShow: true,
      limitName: "Twist",
      limitType: "",
      columnName: `Twist ${TwistBaseLength}m`,
    },
    {
      id: "CantDefect",
      shortName: "CantDefect",
      shouldShow: false,
      limitType: "",
      columnName: "Cant Defect",
    },
    {
      id: "Cant",
      shortName: "Cant",
      shouldShow: true,
      limitName: "Cant",
      limitType: "",
      columnName: "Cant",
    },
    {
      id: "GaugeDeviation",
      shortName: "Gauge",
      shouldShow: true,
      limitName: "Gauge",
      limitType: "",
      columnName: "Gauge Defect",
    },
    {
      id: "Localizations",
      shortName: "Localizations",
      shouldShow: true,
      columnName: "Localization Info",
    },
  ];

  const updateShouldShowChart = (charts) => {
    charts.forEach((chart) => {
      chartTypes.find(
        (chartType) => chartType.shortName === chart
      ).shouldShow = true;
    });
  };

  const updateChartTypes = (alignmentType) => {
    switch (chartThresholds[alignmentType].DefectEvaluationType) {
      case "D1":
        alignmentType === "HorizontalAlignment"
          ? updateShouldShowChart(["AD1L", "AD1R"])
          : updateShouldShowChart(["LLD1L", "LLD1R"]);
        return;
      case "D2":
        alignmentType === "HorizontalAlignment"
          ? updateShouldShowChart(["AD2L", "AD2R"])
          : updateShouldShowChart(["LLD2L", "LLD2R"]);
        return;
      case "Versines":
        alignmentType === "HorizontalAlignment"
          ? updateShouldShowChart(["VHL", "VHR"])
          : updateShouldShowChart(["VVL", "VVR"]);
        return;
    }
  };

  const addAreaCharDataPoint = (
    value,
    areaChartData,
    color,
    severityFlag = ""
  ) => {
    if (
      !areaChartData.length ||
      areaChartData[areaChartData.length - 1].severityFlag !== severityFlag
    ) {
      areaChartData.push({
        axisXType: "secondary",
        severityFlag,
        type: "area",
        markerSize: 0,
        axisXType: "secondary",
        dataPoints: [value],
        color,
        lineColor: "black",
      });
    } else {
      areaChartData[areaChartData.length - 1].dataPoints?.push(value);
    }
  };

  const dataPointGenerator = (values, limits, key = "") => {
    if (!limits.length) {
      return [values, [], null, null];
    }
    const lineChartDataPoints = [];
    const areaChartData = [];
    let currentThresholdIndex = 0;
    let minY = Math.min(
      values?.[0]?.y || Infinity,
      limits[0].LimitsBySeverity[2].Lower
    );
    maxY = Math.max(
      values?.[0]?.y || -Infinity,
      limits[0].LimitsBySeverity[2].Upper
    );
    values?.forEach((value) => {
      if (
        (value.x == null && Number.isNaN(value.x)) ||
        (value.y == null && Number.isNaN(value.y))
      ) {
        return;
      }
      let currentChartThreshold = limits[currentThresholdIndex];
      if (value.x > currentChartThreshold.StationingEnd) {
        if (currentThresholdIndex + 1 < limits.length) {
          currentThresholdIndex += 1;
          currentChartThreshold = limits[currentThresholdIndex];
          minY = Math.min(
            minY,
            currentChartThreshold.LimitsBySeverity[2].Lower
          );
          maxY = Math.max(
            maxY,
            currentChartThreshold.LimitsBySeverity[2].Upper
          );
        } else {
          lineChartDataPoints.push({ ...value });
          addAreaCharDataPoint(value, areaChartData, "transparent");
          if (minY > value.y) {
            minY = value.y;
          }
          if (maxY < value.y) {
            maxY = value.y;
          }
          return;
        }
      }
      if (value.y > currentChartThreshold.LimitsBySeverity[2].Upper) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#E40D3B", "IAL");
      } else if (
        value.y > currentChartThreshold.LimitsBySeverity[1].Upper &&
        value.y < currentChartThreshold.LimitsBySeverity[2].Upper
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FF9B31", "IL");
      } else if (
        value.y > currentChartThreshold.LimitsBySeverity[0].Upper &&
        value.y < currentChartThreshold.LimitsBySeverity[1].Upper
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FFEF35", "AL");
      } else if (
        value.y < currentChartThreshold.LimitsBySeverity[0].Upper &&
        value.y > currentChartThreshold.LimitsBySeverity[0].Lower
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "transparent");
      } else if (
        value.y < currentChartThreshold.LimitsBySeverity[0].Lower &&
        value.y > currentChartThreshold.LimitsBySeverity[1].Lower
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FFEF35", "AL");
      } else if (
        value.y < currentChartThreshold.LimitsBySeverity[1].Lower &&
        value.y > currentChartThreshold.LimitsBySeverity[2].Lower
      ) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#FF9B31", "IL");
      } else if (value.y < currentChartThreshold.LimitsBySeverity[2].Lower) {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "#E40D3B", "IAL");
      } else {
        lineChartDataPoints.push({ ...value });
        addAreaCharDataPoint(value, areaChartData, "transparent");
      }
      if (minY > value.y) {
        minY = value.y;
      }
      if (maxY < value.y) {
        maxY = value.y;
      }
    });
    if (key === "CantDefect") {
      return lineChartDataPoints;
    }
    return [lineChartDataPoints, areaChartData, minY, maxY];
  };

  const getLineColor = (index) => {
    switch (index) {
      case 0:
        return "#FFEF35";
      case 1:
        return "#FF9B31";
      case 2:
        return "#E40D3B";
      default:
        return "#FFEF35";
    }
  };

  const configureThresholdLimits = (currentChartType) => {
    if (currentChartType.id === "Localizations") return [];
    let limits = [];
    if (!currentChartType?.limitType) {
      limits = chartThresholds[currentChartType.limitName].Limits;
    } else {
      limits =
        chartThresholds[currentChartType.limitName][currentChartType.limitType];
    }
    return limits;
  };

  const generateThresholdStriplines = (limits) => {
    const thresholdDataSet = [];
    const addToThresholdData = (start, end, yCoordinate, lineColor) => {
      const commonProps = {
        y: yCoordinate,
        lineColor,
        // indexLabel: "{y}",
        // indexLabelPlacement: "auto",
      };
      thresholdDataSet.push({
        type: "line",
        axisXType: "secondary",
        markerSize: 0,
        lineDashType: "dash",
        lineThickness: 1,
        dataPoints: [
          {
            x: start,
            ...commonProps,
          },
          {
            x: end,
            ...commonProps,
          },
        ],
      });
    };
    for (const limit of limits) {
      if (limit.StationingStart > StationingEnd) break;
      if (
        limit.StationingStart <= StationingEnd &&
        limit.StationingEnd > StationingStart
      ) {
        limit.LimitsBySeverity.forEach((element, index) => {
          const lineColor = getLineColor(index);
          addToThresholdData(
            limit.StationingStart,
            limit.StationingEnd,
            element.Lower,
            lineColor
          );
          addToThresholdData(
            limit.StationingStart,
            limit.StationingEnd,
            element.Upper,
            lineColor
          );
        });
      }
    }
    return thresholdDataSet;
  };

  const generateEventStriplines = (chartListLength) => {
    const eventStripLines = [];
    events?.forEach((event) => {
      console.log("event: ", event.StationingStart);
      eventStripLines.push({
        value: event.StationingStart,
        labelPlacement: "outside",
        lineDashType: "longDash",
        labelBackgroundColor: "#fff",
        color: "#000",
        label:
          chartListLength === 7
            ? event.IsRange
              ? `${event.StationingStart},${event.Name.toUpperCase().slice(
                  0,
                  4
                )}\u25BC`
              : event.StationingStart.toString()
            : "",
        showOnTop: true,
        labelFontColor: "#000",
        labelFontFamily: "Roboto",
        labelWrap: true,
        labelAlign: "near",
        labelAngle: 270,
        labelFontSize: 10,
        labelMaxWidth: 65,
      });
      if (event.IsRange) {
        console.log("event end: ", event.StationingEnd);
        eventStripLines.push({
          value: event.StationingEnd,
          labelPlacement: "outside",
          lineDashType: "longDash",
          color: "#000",
          labelBackgroundColor: "#fff",
          label:
            chartListLength === 7
              ? `${event.StationingEnd.toString()},${event.Name.toLowerCase().slice(
                  0,
                  4
                )}\u25B2`
              : "",
          showOnTop: true,
          labelFontColor: "#000",
          labelFontFamily: "Roboto",
          labelWrap: true,
          labelAlign: "near",
          labelAngle: 270,
          labelFontSize: 10,
          labelMaxWidth: 65,
        });
      }
    });
    return eventStripLines;
  };

  const generateSpeedZoneStriplines = (speedZones, chartListLength) => {
    return speedZones.map((limit) => ({
      value: limit.value,
      labelPlacement: "outside",
      lineDashType: "longDashDot",
      color: "#000",
      label:
        chartListLength === 7
          ? `${limit.MinSpeed.toFixed(1)}<V<=${limit.MaxSpeed.toFixed(
              1
            )} \u25BC`
          : "",
      showOnTop: true,
      labelBackgroundColor: "#fff",
      labelFontColor: "#5a5a5a",
      labelFontFamily: "Roboto",
      labelWrap: false,
      labelAlign: "near",
      labelAngle: 270,
      labelFontSize: 10,
      labelMaxWidth: 65,

      labelWrap: true,
    }));
  };

  const addLabels = (index, columnName) => {
    if (index === 7) {
      return;
    }
    if (columnName === "Cant") {
      document.querySelector(
        `.row:nth-of-type(${index + 1}) p`
      ).innerHTML = `Cant Defect 1:${DefectScale.toFixed(
        0
      )}[mm] <br> ${columnName} 1:${SignalScale.toFixed(0)}[mm]`;
      return;
    }
    document.querySelector(
      `.row:nth-of-type(${index + 1}) p`
    ).innerHTML = `${columnName} <br> 1:${DefectScale.toFixed(0)}[mm]`;
  };

  const generateYAxisLabels = (limits) => {
    let labels = [];
    limits?.[0]?.LimitsBySeverity.forEach((limit) => {
      labels = [...labels, limit.Upper, limit.Lower];
    });
    return labels;
  };

  const newChartData = {};

  updateChartTypes("HorizontalAlignment");
  updateChartTypes("VerticalAlignment");

  let chartData = [];
  if (VisualTrackDatas?.length) {
    VisualTrackDatas.forEach((row) => {
      row.ParameterValues.forEach((cell) => {
        if (!newChartData[cell.Id]) newChartData[cell.Id] = [];
        newChartData[cell.Id].push({
          x: row.Stationing.Value,
          y: cell.Value,
        });
      });
    });
    chartData = chartTypes.reduce(
      (prev, current) => ({
        ...prev,
        [current.id]: newChartData[current.id],
      }),
      {}
    );
    const withLocalization = { ...chartData, Localizations: [] };
    chartData = withLocalization;
  } else {
    chartData = {
      VersineVerticalRight: [],
      VersineVerticalLeft: [],
      VersineHorizontalRight: [],
      VersineHorizontalLeft: [],
      LongitudinalLevelD2Right: [],
      LongitudinalLevelD2Left: [],
      LongitudinalLevelD1Right: [],
      LongitudinalLevelD1Left: [],
      AlignmentD2Right: [],
      AlignmentD2Left: [],
      AlignmentD1Right: [],
      AlignmentD1Left: [],
      TwistBase1: [],
      CantDefect: [],
      Cant: [],
      GaugeDeviation: [],
      Localizations: [],
    };
  }
  if (chartData) {
    let index = 0;
    let prevAxisYBounds = 0;
    const chartList = [];
    const speedZones = chartThresholds.Gauge.Limits.map((limit) => ({
      value: limit.StationingEnd,
      MinSpeed: limit.MinSpeed,
      MaxSpeed: limit.MaxSpeed,
    }));
    for (const [key, value] of Object.entries(chartData)) {
      const param = chartTypes.find((paramItem) => paramItem.id === key);
      if (param && param.shouldShow) {
        const limits = configureThresholdLimits(param);
        const yAxisLabels = generateYAxisLabels(limits);
        const [lineChartDataPoints, areaChartData, minY, maxY] =
          dataPointGenerator(value, limits);

        let thresholdDataSet = [];
        thresholdDataSet = generateThresholdStriplines(limits);
        const eventStripLines = DisplayEvents
          ? generateEventStriplines(chartList.length)
          : [];
        const speedZoneStripLines = generateSpeedZoneStriplines(
          speedZones,
          chartList.length
        );
        let height = ((maxY - minY) / DefectScale) * 3.7795275591 + 13;
        if (chartList.length === 7) {
          height = 85;
        }
        // const isChartCentral = height <= 100
        chartList.push({
          height: height,
          backgroundColor:
            chartList.length % 2 === 0
              ? "rgb(220, 220, 220, 0.5)"
              : "transparent",
          axisX2: {
            minimum: StationingStart,
            maximum: StationingEnd + 1,
            lineThickness: 0,
            gridThickness: 0,
            tickLength: 0,
            tickPlacement: "inside",
            labelPlacement: "inside",
            labelAutoFit: true,
            labelWrap: false,
            labelFontWeight: "lighter",
            labelFormatter: () => "",
            crosshair: {
              enabled: true,
              snapToDataPoint: true,
              lineDashType: "solid",
              labelFormatter: () => "",
            },
            interval:
              Math.abs(StationingEnd - StationingStart) < 200
                ? +Math.floor(
                    Math.abs(StationingEnd - StationingStart) / 2
                  ).toFixed()
                : null,
            stripLines: [...eventStripLines, ...speedZoneStripLines],
          },
          axisY: {
            titleWrap: false,
            lineThickness: 0,
            gridThickness: 0,
            tickLength: 0,
            maximum: maxY + 1,
            minimum: minY - 1,
            labelFormatter: () => "",
            labelAutoFit: true,
            stripLines: yAxisLabels.map((yAxisLabel, index) => ({
              value: yAxisLabel,
              labelPlacement: "outside",
              lineDashType: "solid",
              color: "transparent",
              label: yAxisLabel.toString(),
              showOnTop: true,
              labelFontColor: "#000",
              labelFontFamily: "Roboto",
              labelWrap: false,
              labelAlign: "near",
              labelBackgroundColor: "transparent",
              labelFontSize: 10,
              labelMaxWidth: 20,
            })),
          },
          axisX: {
            minimum: StationingStart,
            maximum: StationingEnd + 1,
            tickLength: 2,
            labelAutoFit: true,
            labelWrap: false,
            labelFontWeight: "lighter",
            labelFontSize: 10,
            interval:
              Math.abs(StationingEnd - StationingStart) < 200
                ? +Math.floor(
                    Math.abs(StationingEnd - StationingStart) / 2
                  ).toFixed()
                : null,
            labelFormatter:
              chartList.length === 7
                ? function (e) {
                    return e.value;
                  }
                : () => "",
            labelAngle: 270,
            stripLines: [...eventStripLines, ...speedZoneStripLines],
          },
          data: [
            {
              type: "line",
              lineDashType:
                param.shortName === "Cant" ? "longDashDotDot" : "solid",
              axisXType: chartList.length === 7 ? "primary" : "secondary",
              markerSize: 0,
              dataPoints: lineChartDataPoints,
              lineColor: "black",
            },
            ...areaChartData,
            ...thresholdDataSet,
          ],
        });
        if (param.shortName === "Cant") {
          const cantDefects = dataPointGenerator(
            chartData.CantDefect,
            limits,
            "CantDefect"
          );
          chartList[chartList.length - 1].data.push({
            type: "line",
            lineDashType: "solid",
            axisXType: "secondary",
            markerSize: 0,
            dataPoints: cantDefects,
            lineColor: "black",
          });
        }
        const options = {
          animationEnabled: false,
          charts: [chartList[chartList.length - 1]],
          rangeSelector: {
            enabled: false,
          },
          navigator: {
            enabled: false,
          },
        };
        addLabels(index, param.columnName);
        document.querySelector(
          `#chart-${index + 1}`
        ).style.width = `${PageWidth}px`;
        document.querySelector(
          `#chart-${index + 1}`
        ).style.height = `${height}px`;
        const stockChart = new CanvasJS.StockChart(
          `chart-${index + 1}`,
          options
        );
        stockChart.render();
        if (index > 0) {
          stockChart.charts[0].axisY[0].set(
            "margin",
            prevAxisYBounds -
              (stockChart.charts[0].axisY[0].bounds.x2 -
                stockChart.charts[0].axisY[0].bounds.x1)
          );
        } else {
          prevAxisYBounds = stockChart.charts[0].axisY[0].bounds.x2;
        }
        index++;
      }
    }

    document.querySelector("#canvasjsChart").style.width = `${
      PageWidth + 21
    }px`;
    var canvas = await html2canvas(document.querySelector("#canvasjsChart"));
    return canvas.toDataURL();
  }
};
