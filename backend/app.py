# pip install matplotlib numpy

import matplotlib.pyplot as plt
import numpy as np


class InteractiveHexagon:
    def __init__(self):
        self.fig, self.ax = plt.subplots(figsize=(7, 7))
        self.ax.set_aspect('equal')
        self.ax.axis('off')
        self.center = np.array([0.0, 0.0])
        angles = np.linspace(0, 2 * np.pi, 7)[:-1] + np.pi / 6
        self.vertices = np.column_stack((np.cos(angles), np.sin(angles)))
        self.triangles_data = []

        for i in range(6):
            v1 = self.vertices[i]
            v2 = self.vertices[(i + 1) % 6]
            tri_coords = np.array([self.center, v1, v2])
            centroid = np.mean(tri_coords, axis=0)
            polygon = plt.Polygon(
                tri_coords,
                edgecolor='darkblue',
                facecolor='#E3F2FD',
                lw=2,
                picker=True,
            )
            self.ax.add_patch(polygon)
            text_obj = self.ax.text(
                centroid[0],
                centroid[1],
                '',
                ha='center',
                va='center',
                fontsize=16,
                fontweight='bold',
                color='#1A237E',
            )
            self.triangles_data.append({
                'polygon': polygon,
                'text_obj': text_obj,
                'number': i + 1,
                'is_active': False,
            })

        self.fig.canvas.mpl_connect('pick_event', self.on_triangle_click)
        self.ax.set_xlim(-1.2, 1.2)
        self.ax.set_ylim(-1.2, 1.2)
        plt.title('Click inside a triangle to toggle its number', fontsize=14, pad=10)

    def on_triangle_click(self, event):
        for item in self.triangles_data:
            if item['polygon'] == event.artist:
                item['is_active'] = not item['is_active']
                item['polygon'].set_facecolor(
                    '#FFCC80' if item['is_active'] else '#E3F2FD'
                )
                item['text_obj'].set_text(str(item['number']) if item['is_active'] else '')
                self.fig.canvas.draw_idle()
                break


if __name__ == '__main__':
    InteractiveHexagon()
    plt.show()
