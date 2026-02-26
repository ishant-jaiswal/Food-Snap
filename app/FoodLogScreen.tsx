import { CircularProgress } from "@/components/CircularProgress";
import { ThemedText } from "@/components/ThemedText";
import { BorderRadius, Colors, Shadows, Spacing, Typography } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { FoodLogEntry, getFoodLogsInRange } from "@/services/foodService";
import { Feather } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Dimensions, LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, UIManager, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Defs, Line, LinearGradient, Rect, Stop, Text as SvgText } from "react-native-svg";

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

type TimeFilter = "Weekly" | "Monthly";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function FoodLogScreen() {
    const tabBarHeight = useBottomTabBarHeight();
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const navigation = useNavigation();
    const [activeFilter, setActiveFilter] = useState<TimeFilter>("Weekly");
    const [logs, setLogs] = useState<FoodLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const filters: TimeFilter[] = ["Weekly", "Monthly"];

    const fetchLogs = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);
        try {
            const endDate = new Date();
            const startDate = new Date();

            if (activeFilter === "Weekly") {
                // Last 7 days including today
                startDate.setDate(endDate.getDate() - 6);
            } else {
                // Last 30 days
                startDate.setDate(endDate.getDate() - 29);
            }

            const startStr = startDate.toISOString().split('T')[0];
            const endStr = endDate.toISOString().split('T')[0];

            const fetchedLogs = await getFoodLogsInRange(user.id, startStr, endStr);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setLogs(fetchedLogs);
        } catch (error) {
            console.error("Failed to fetch logs range", error);
        } finally {
            setIsLoading(false);
        }
    }, [user, activeFilter]);

    useFocusEffect(
        useCallback(() => {
            fetchLogs();
        }, [fetchLogs])
    );

    const processChartData = () => {
        const daysMap = new Map<string, number>();
        const today = new Date();
        const numDays = activeFilter === "Weekly" ? 7 : 30;
        const labels: string[] = [];
        const dates: Date[] = [];

        for (let i = numDays - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            daysMap.set(dStr, 0);
            dates.push(new Date(d));

            if (activeFilter === "Weekly") {
                // Short day name: Mon, Tue
                labels.push(d.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3));
            } else {
                // Day number
                labels.push(d.getDate().toString());
            }
        }

        logs.forEach(log => {
            const current = daysMap.get(log.dateStr) || 0;
            daysMap.set(log.dateStr, current + log.calories);
        });

        // For calendar, we need the full date list with calorie info
        return Array.from(daysMap.entries()).map(([dateStr, cals], index) => ({
            dateStr,
            dateObj: dates[index],
            dayLabel: labels[index],
            calories: cals,
        }));
    };

    const chartData = processChartData();
    const USER_GOAL = (user as any)?.calorieTarget || 2000;
    const maxDataVal = Math.max(...chartData.map(d => d.calories), USER_GOAL, 100) * 1.1;

    // Chart Dimensions
    const CHART_HEIGHT = 220;
    const SVG_PADDING_BOTTOM = 30;
    const SVG_PADDING_TOP = 20;
    const AVAILABLE_HEIGHT = CHART_HEIGHT - SVG_PADDING_BOTTOM - SVG_PADDING_TOP;
    const CARD_PADDING = Spacing.md * 2;
    const CHART_WIDTH = SCREEN_WIDTH - CARD_PADDING - Spacing.lg;

    // ---- CHART RENDERING LOGIC ----

    const renderWeeklyBarChart = () => {
        const numBars = 7;
        const barWidth = 16;
        const spacing = (CHART_WIDTH - (numBars * barWidth)) / (numBars + 1);

        return (
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
                <Defs>
                    <LinearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={Colors.light.primary} stopOpacity="1" />
                        <Stop offset="1" stopColor={Colors.light.primary} stopOpacity="0.7" />
                    </LinearGradient>
                    <LinearGradient id="barOverGrad" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={Colors.light.orange} stopOpacity="1" />
                        <Stop offset="1" stopColor={Colors.light.orange} stopOpacity="0.7" />
                    </LinearGradient>
                </Defs>

                {/* Goal Line */}
                <Line
                    x1="0"
                    y1={SVG_PADDING_TOP + AVAILABLE_HEIGHT * (1 - USER_GOAL / maxDataVal)}
                    x2={CHART_WIDTH}
                    y2={SVG_PADDING_TOP + AVAILABLE_HEIGHT * (1 - USER_GOAL / maxDataVal)}
                    stroke={Colors.light.success}
                    strokeWidth="1.5"
                    strokeDasharray="6, 4"
                    opacity="0.6"
                />
                <SvgText
                    x={CHART_WIDTH}
                    y={SVG_PADDING_TOP + AVAILABLE_HEIGHT * (1 - USER_GOAL / maxDataVal) - 5}
                    fontSize="10"
                    fill={Colors.light.success}
                    textAnchor="end"
                    fontWeight="bold"
                >
                    Goal
                </SvgText>

                {chartData.map((d, i) => {
                    const barHeight = (d.calories / maxDataVal) * AVAILABLE_HEIGHT;
                    const x = spacing + (barWidth + spacing) * i;
                    const y = SVG_PADDING_TOP + AVAILABLE_HEIGHT - barHeight;
                    const isOver = d.calories > USER_GOAL;

                    return (
                        <React.Fragment key={i}>
                            <Rect
                                x={x}
                                y={SVG_PADDING_TOP}
                                width={barWidth}
                                height={AVAILABLE_HEIGHT}
                                fill={theme.border}
                                rx={barWidth / 2}
                                opacity="0.2"
                            />
                            <Rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                fill={isOver ? "url(#barOverGrad)" : "url(#barGrad)"}
                                rx={barWidth / 2}
                            />
                            <SvgText
                                x={x + barWidth / 2}
                                y={CHART_HEIGHT - 10}
                                fontSize="10"
                                fill={theme.textSecondary}
                                textAnchor="middle"
                            >
                                {d.dayLabel}
                            </SvgText>
                        </React.Fragment>
                    );
                })}
            </Svg>
        );
    };

    const renderMonthlyCalendar = () => {
        // Week Days Header
        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        // Use chartData which contains last 30 days
        // We need to front-pad with empty slots to align with day of week
        if (chartData.length === 0) return null;

        const firstDate = chartData[0].dateObj;
        const dayOfWeek = firstDate.getDay(); // 0 (Sun) to 6 (Sat)
        const emptySlots = Array(dayOfWeek).fill(null);

        const allSlots = [...emptySlots, ...chartData];

        return (
            <View style={{ width: '100%' }}>
                {/* Header */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 }}>
                    {weekDays.map(day => (
                        <ThemedText key={day} style={{ fontSize: 10, color: theme.textSecondary, width: 30, textAlign: 'center' }}>{day}</ThemedText>
                    ))}
                </View>

                {/* Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                    {allSlots.map((item, index) => {
                        // Use percentage to avoid sub-pixel wrapping issues
                        const widthPercent = '14.28%'; // 100/7

                        if (!item) {
                            return <View key={`empty-${index}`} style={{ width: widthPercent, aspectRatio: 1 }} />;
                        }

                        const { calories, dateObj } = item;
                        const dayNum = dateObj.getDate();
                        const isToday = new Date().getDate() === dayNum && new Date().getMonth() === dateObj.getMonth();

                        let bgColor = "transparent";
                        let textColor = theme.text;
                        let borderColor = "transparent";

                        if (calories > 0) {
                            if (calories > USER_GOAL) {
                                bgColor = Colors.light.orange;
                                textColor = "#FFF";
                                borderColor = Colors.light.orange;
                            } else {
                                bgColor = Colors.light.primary;
                                textColor = "#FFF";
                                borderColor = Colors.light.primary;
                            }
                        }

                        // Special style for Today if empty
                        if (isToday && calories === 0) {
                            borderColor = Colors.light.primary;
                            textColor = Colors.light.primary;
                        }

                        return (
                            <View key={item.dateStr} style={{ width: widthPercent, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', marginBottom: 4 }}>
                                <View style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    backgroundColor: bgColor,
                                    borderWidth: 1,
                                    borderColor: borderColor === "transparent" ? "transparent" : borderColor,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <ThemedText style={{ fontSize: 10, fontWeight: '600', color: textColor }}>
                                        {dayNum}
                                    </ThemedText>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
        );
    };

    const processMacros = () => {
        if (logs.length === 0) return { protein: 0, carbs: 0, fats: 0 };
        const totalMacros = logs.reduce((acc, curr) => ({
            p: acc.p + curr.protein,
            c: acc.c + curr.carbs,
            f: acc.f + curr.fats
        }), { p: 0, c: 0, f: 0 });

        const totalGrams = totalMacros.p + totalMacros.c + totalMacros.f;
        if (totalGrams === 0) return { protein: 0, carbs: 0, fats: 0 };

        return {
            protein: Math.round((totalMacros.p / totalGrams) * 100),
            carbs: Math.round((totalMacros.c / totalGrams) * 100),
            fats: Math.round((totalMacros.f / totalGrams) * 100)
        };
    };

    const macroPcts = processMacros();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <ThemedText style={styles.title}>Food Insights</ThemedText>

                {/* Segmented Control */}
                <View style={[styles.filterContainer, { backgroundColor: theme.card }]}>
                    {filters.map((filter) => (
                        <Pressable
                            key={filter}
                            style={[
                                styles.filterButton,
                                activeFilter === filter && { backgroundColor: Colors.light.primary },
                            ]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <ThemedText
                                style={[
                                    styles.filterText,
                                    activeFilter === filter ? { color: "#FFFFFF", fontWeight: '700' } : { color: theme.textSecondary },
                                ]}
                            >
                                {filter}
                            </ThemedText>
                        </Pressable>
                    ))}
                </View>
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={{
                    paddingHorizontal: Spacing.md,
                    paddingTop: Spacing.md,
                    paddingBottom: tabBarHeight + Spacing.xl,
                }}
                showsVerticalScrollIndicator={false}
            >
                {isLoading ? (
                    <ActivityIndicator size="large" color={Colors.light.primary} style={{ marginTop: 50 }} />
                ) : (
                    <>
                        {/* Dynamic Chart Card */}
                        <View style={[styles.card, { backgroundColor: theme.card }]}>
                            <View style={styles.cardHeader}>
                                <Feather name={activeFilter === 'Weekly' ? "bar-chart-2" : "calendar"} size={18} color={theme.text} />
                                <ThemedText style={styles.sectionTitle}>
                                    {activeFilter === 'Weekly' ? 'Calorie Trends' : 'Monthly Log'}
                                </ThemedText>
                            </View>

                            <View style={{ alignItems: 'center', justifyContent: activeFilter === 'Weekly' ? 'flex-end' : 'flex-start', minHeight: 220, paddingTop: 10 }}>
                                {activeFilter === "Weekly" ? renderWeeklyBarChart() : renderMonthlyCalendar()}
                            </View>
                        </View>

                        {/* Macro Distributions */}
                        <View style={[styles.card, { backgroundColor: theme.card }]}>
                            <View style={styles.cardHeader}>
                                <Feather name="pie-chart" size={18} color={theme.text} />
                                <ThemedText style={styles.sectionTitle}>Average Macros</ThemedText>
                            </View>
                            <View style={styles.macroRow}>
                                <View style={styles.macroItem}>
                                    <CircularProgress
                                        value={macroPcts.protein}
                                        maxValue={100}
                                        size={70}
                                        color={Colors.light.primary}
                                        strokeWidth={6}
                                        showText={false}
                                    >
                                        <ThemedText style={styles.macroValue}>{macroPcts.protein}%</ThemedText>
                                    </CircularProgress>
                                    <ThemedText style={styles.macroLabel}>Protein</ThemedText>
                                </View>
                                <View style={styles.macroItem}>
                                    <CircularProgress
                                        value={macroPcts.carbs}
                                        maxValue={100}
                                        size={70}
                                        color={Colors.light.secondary}
                                        strokeWidth={6}
                                        showText={false}
                                    >
                                        <ThemedText style={styles.macroValue}>{macroPcts.carbs}%</ThemedText>
                                    </CircularProgress>
                                    <ThemedText style={styles.macroLabel}>Carbs</ThemedText>
                                </View>
                                <View style={styles.macroItem}>
                                    <CircularProgress
                                        value={macroPcts.fats}
                                        maxValue={100}
                                        size={70}
                                        color={Colors.light.accent}
                                        strokeWidth={6}
                                        showText={false}
                                    >
                                        <ThemedText style={styles.macroValue}>{macroPcts.fats}%</ThemedText>
                                    </CircularProgress>
                                    <ThemedText style={styles.macroLabel}>Fats</ThemedText>
                                </View>
                            </View>
                        </View>

                        {/* Quick Tips */}
                        <View style={[styles.insightCard, {
                            backgroundColor: isDark ? "rgba(255, 193, 7, 0.1)" : "#FFF8E1",
                            borderColor: "rgba(255, 193, 7, 0.3)",
                            borderWidth: 1
                        }]}>
                            <View style={styles.insightIcon}>
                                <Feather name="zap" size={20} color={Colors.light.accent} />
                            </View>
                            <View style={styles.insightContent}>
                                <ThemedText style={styles.insightTitle}>Insight</ThemedText>
                                <ThemedText style={[styles.insightText, { color: theme.textSecondary }]}>
                                    {logs.length > 0
                                        ? `You've logged ${logs.length} items. Consistency is key to reaching your goal!`
                                        : "Start logging your meals to unlock personalized insights."}
                                </ThemedText>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.sm,
        paddingTop: Platform.OS === 'android' ? Spacing.xl : Spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    title: {
        ...Typography.h2,
        marginBottom: Spacing.md,
    },
    filterContainer: {
        flexDirection: "row",
        padding: 4,
        borderRadius: BorderRadius.lg,
    },
    filterButton: {
        flex: 1,
        paddingVertical: 6,
        alignItems: "center",
        borderRadius: BorderRadius.md - 2,
    },
    filterText: {
        ...Typography.captionMedium,
        fontWeight: '600',
    },
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.md,
        ...Shadows.soft,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        gap: 8
    },
    sectionTitle: {
        ...Typography.bodyMedium,
        fontWeight: '700',
    },
    macroRow: {
        flexDirection: "row",
        justifyContent: "space-around",
        paddingTop: Spacing.sm
    },
    macroItem: {
        alignItems: "center",
    },
    macroValue: {
        ...Typography.captionMedium,
        fontWeight: '700',
        textAlign: 'center',
    },
    macroLabel: {
        marginTop: 8,
        ...Typography.caption,
        fontWeight: '500'
    },
    insightCard: {
        flexDirection: "row",
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.xl,
        alignItems: "center",
    },
    insightIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "rgba(255, 193, 7, 0.2)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: Spacing.md,
    },
    insightContent: {
        flex: 1,
    },
    insightTitle: {
        ...Typography.bodyMedium,
        fontWeight: '700',
        marginBottom: 2,
    },
    insightText: {
        ...Typography.caption,
        lineHeight: 18,
    },
});
