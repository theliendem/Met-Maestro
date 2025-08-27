import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../theme/AppTheme';
import { IconSymbol } from '../ui/IconSymbol';

interface Show {
  id: string;
  name: string;
  measures: {
    id: string;
    timeSignature: { numerator: number; denominator: number };
    tempo: number;
    count: number;
    letter?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface ShowSelectorProps {
  shows: Show[];
  selectedShowId: string | null;
  onSelectShow: (showId: string) => void;
  onAddShow: () => void;
  onRenameShow?: (showId: string, newName: string) => void;
  onDeleteShow?: (showId: string) => void;
}

export const ShowSelector: React.FC<ShowSelectorProps> = ({
  shows,
  selectedShowId,
  onSelectShow,
  onAddShow,
  onRenameShow,
  onDeleteShow,
}) => {
  const theme = useAppTheme();

  return (
    <View style={[styles.container, { borderColor: theme.colors.accent }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Shows
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { borderColor: theme.colors.accent }]}
          onPress={onAddShow}
        >
          <IconSymbol name="plus" size={16} color={theme.colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.showList} showsVerticalScrollIndicator={false}>
        {shows.map((show) => (
          <TouchableOpacity
            key={show.id}
            style={[
              styles.showItem,
              {
                borderColor: selectedShowId === show.id ? theme.colors.accent : theme.colors.icon,
                backgroundColor: selectedShowId === show.id
                  ? 'rgba(187, 134, 252, 0.1)'
                  : 'transparent',
              }
            ]}
            onPress={() => onSelectShow(show.id)}
          >
            <View style={styles.showInfo}>
              <Text style={[styles.showName, { color: theme.colors.text }]}>
                {show.name}
              </Text>
              <Text style={[styles.showDetails, { color: theme.colors.icon }]}>
                {show.measures.length} measures
              </Text>
            </View>

            <View style={styles.showActions}>
              {onRenameShow && (
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: theme.colors.icon }]}
                  onPress={() => onRenameShow(show.id, show.name)}
                >
                  <IconSymbol name="pencil" size={14} color={theme.colors.icon} />
                </TouchableOpacity>
              )}

              {onDeleteShow && (
                <TouchableOpacity
                  style={[styles.actionButton, { borderColor: theme.colors.icon }]}
                  onPress={() => onDeleteShow(show.id)}
                >
                  <IconSymbol name="trash" size={14} color={theme.colors.icon} />
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {shows.length === 0 && (
          <View style={styles.emptyState}>
            <IconSymbol name="music.note.list" size={48} color={theme.colors.icon} />
            <Text style={[styles.emptyText, { color: theme.colors.icon }]}>
              No shows yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.colors.icon }]}>
              Tap + to create your first show
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    height: 200,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  addButton: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  showList: {
    flex: 1,
    padding: 8,
  },
  showItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 6,
    marginVertical: 4,
  },
  showInfo: {
    flex: 1,
  },
  showName: {
    fontSize: 16,
    fontWeight: '500',
  },
  showDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  showActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
