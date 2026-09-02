import { useLanguage } from '../context/LanguageContext';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

import { useRouter } from 'expo-router';
import { Colors } from '../constants/colors';
import { Spacing, Radius, Shadow } from '../constants/spacing';
import { useCrop } from '../context/CropContext';
import { ArrowLeft, Sprout, Leaf, TreePine, Wheat, Sun, Droplets } from 'lucide-react-native';

const DEFAULT_STAGES = [
  { id: 'germination', title: 'Germination', days: 'Day 0 - 7', desc: 'Seeds absorb water, swell and break open. The primary root (radicle) emerges.', icon: Sprout, img: 'https://images.unsplash.com/photo-1593488737229-87bd8992f58d?w=400&q=80' },
  { id: 'seedling', title: 'Seedling', days: 'Day 7 - 20', desc: 'First true leaves emerge. Root system begins expanding to gather nutrients.', icon: Leaf, img: 'https://images.unsplash.com/photo-1416879598553-61cefc4f8b24?w=400&q=80' },
  { id: 'vegetative', title: 'Vegetative', days: 'Day 20 - 50', desc: 'Rapid growth of stems and foliage. High nitrogen requirement during this phase.', icon: TreePine, img: 'https://images.unsplash.com/photo-1530836369250-ef71a35921bf?w=400&q=80' },
  { id: 'flowering', title: 'Flowering / Booting', days: 'Day 50 - 70', desc: 'Buds form and flowers open. Critical water requirement. Pollination occurs.', icon: Sun, img: 'https://images.unsplash.com/photo-1455158652395-5bc7cfbe9dbd?w=400&q=80' },
  { id: 'fruiting', title: 'Fruiting / Grain Fill', days: 'Day 70 - 100', desc: 'Fruit or grain develops and swells. High potassium requirement for crop weight.', icon: Droplets, img: 'https://images.unsplash.com/photo-1596489312217-fb9d750c1f60?w=400&q=80' },
  { id: 'harvest', title: 'Maturity & Harvest', days: 'Day 100+', desc: 'Plant dries down. Moisture drops to harvestable levels. Ready for cutting.', icon: Wheat, img: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80' },
];

export default function PlantLifecycleScreen() {
  const { t } = useLanguage();
  const router = useRouter();
  const { activeCrop } = useCrop();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <ArrowLeft size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Plant Life Cycle')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        
        {activeCrop ? (
          <View style={styles.heroBox}>
            <Text style={styles.heroEmoji}>{activeCrop.emoji}</Text>
            <Text style={styles.heroTitle}>{activeCrop.name} Life Cycle</Text>
            <Text style={styles.heroSub}>Total duration: {activeCrop.durationDays} days</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(100, Math.max(0, (activeCrop.currentDay / activeCrop.durationDays) * 100))}%`, backgroundColor: activeCrop.color }]} />
            </View>
            <Text style={styles.progressText}>Current: Day {activeCrop.currentDay} of {activeCrop.durationDays}</Text>
          </View>
        ) : (
          <View style={styles.heroBox}>
            <Text style={styles.heroTitle}>{t('General Crop Life Cycle')}</Text>
            <Text style={styles.heroSub}>{t('Typical stages of plant development')}</Text>
          </View>
        )}

        <View style={styles.timeline}>
          {DEFAULT_STAGES.map((stage, index) => {
            const Icon = stage.icon;
            const isLast = index === DEFAULT_STAGES.length - 1;
            
            // Highlight current stage roughly based on percentage
            const pct = activeCrop ? (activeCrop.currentDay / activeCrop.durationDays) : 0;
            const stagePct = index / DEFAULT_STAGES.length;
            const isCurrent = activeCrop && pct >= stagePct && pct < (index + 1) / DEFAULT_STAGES.length;

            return (
              <View key={stage.id} style={styles.stageRow}>
                {/* Timeline line */}
                <View style={styles.timelineGutter}>
                  <View style={[styles.timelineNode, isCurrent && styles.timelineNodeActive]}>
                    <Icon size={14} color={isCurrent ? '#fff' : Colors.textSecondary} />
                  </View>
                  {!isLast && <View style={[styles.timelineLine, isCurrent && styles.timelineLineActive]} />}
                </View>

                {/* Stage Content */}
                <View style={[styles.stageCard, isCurrent && styles.stageCardActive]}>
                  {isCurrent && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>{t('CURRENT STAGE')}</Text></View>}
                  
                  <Image source={{ uri: stage.img }} style={styles.stageImg} />
                  <View style={styles.stageInfo}>
                    <Text style={styles.stageTitle}>{stage.title}</Text>
                    <Text style={styles.stageDays}>{stage.days}</Text>
                    <Text style={styles.stageDesc}>{stage.desc}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.base, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: Colors.surface,
  },
  backBtn: { width: 40, height: 40, borderRadius: Radius.md, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  scroll: { padding: Spacing.base },
  heroBox: {
    backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.xl,
    alignItems: 'center', marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border, ...Shadow.sm
  },
  heroEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  heroTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  heroSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.lg },
  progressBar: { width: '100%', height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 4 },
  progressText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  
  timeline: { paddingLeft: 4 },
  stageRow: { flexDirection: 'row', minHeight: 140 },
  timelineGutter: { width: 40, alignItems: 'center' },
  timelineNode: { width: 28, height: 28, borderRadius: 14, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', zIndex: 2, borderWidth: 2, borderColor: Colors.border },
  timelineNodeActive: { backgroundColor: Colors.primary, borderColor: Colors.primaryLight, borderWidth: 3 },
  timelineLine: { width: 2, flex: 1, backgroundColor: Colors.border, marginVertical: 4 },
  timelineLineActive: { backgroundColor: Colors.primary },
  
  stageCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: Radius.xl, marginBottom: Spacing.xl,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
    position: 'relative', top: -10,
  },
  stageCardActive: { borderColor: Colors.primary, borderWidth: 1.5, ...Shadow.md },
  currentBadge: { position: 'absolute', top: 10, right: 10, backgroundColor: Colors.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: Radius.sm, zIndex: 10 },
  currentBadgeText: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  stageImg: { width: '100%', height: 120, resizeMode: 'cover' },
  stageInfo: { padding: Spacing.md },
  stageTitle: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  stageDays: { fontSize: 12, fontWeight: '700', color: Colors.primary, marginBottom: 6 },
  stageDesc: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
});
